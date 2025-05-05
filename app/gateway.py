from flask import Flask, request, jsonify, Response, render_template
import requests
from app.idsServer import detect_attack, log_attack
import socket
import os
from urllib.parse import urljoin
from app.gateway_config import (
    ADMIN_LOGIN_ENDPOINTS, 
    DETECTION_THRESHOLDS, 
    LOG_CONFIG, 
    DB_CONFIG,
    GATEWAY_HOST,
    GATEWAY_PORT
)
import logging
from datetime import datetime, timedelta
import mysql.connector
from collections import defaultdict
import re
import json
from flask_cors import CORS

class APIGateway:
    def __init__(self, target_url):
        self.target_url = 'http://localhost:5000'  # Backend URL
        self.app = Flask(__name__)
        
        # Configure CORS to allow requests from frontend
        CORS(self.app, resources={
            r"/*": {
                "origins": ["http://localhost:3000", "http://127.0.0.1:3000"],
                "methods": ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
                "allow_headers": ["Content-Type", "Authorization"]
            }
        })
        
        self.setup_routes()
        self.setup_logging()
        self.setup_database()
        self.login_attempts = defaultdict(list)
        self.suspicious_ips = set()
        self.blocked_ips = set()
        self.last_login_attempt = defaultdict(datetime)
        
        logging.info("=== Gateway Configuration ===")
        logging.info(f"Frontend URL: http://localhost:3000")
        logging.info(f"Backend URL: {self.target_url}")
        logging.info(f"Gateway URL: http://localhost:1337")

    def setup_logging(self):
        # Create logs directory if it doesn't exist
        if not os.path.exists('logs'):
            os.makedirs('logs')
            
        logging.basicConfig(
            filename='logs/gateway.log',
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s - %(message)s'
        )

    def setup_database(self):
        self.db = mysql.connector.connect(**DB_CONFIG)
        self.cursor = self.db.cursor()
        self.create_tables()

    def create_tables(self):
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS login_attempts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                ip_address VARCHAR(45),
                email VARCHAR(255),
                attempt_time TIMESTAMP,
                success BOOLEAN,
                attack_type VARCHAR(50),
                user_agent TEXT,
                request_data TEXT,
                endpoint VARCHAR(255)
            )
        """)
        self.db.commit()

    def log_login_attempt(self, ip_address, email, success, attack_type=None, user_agent=None, request_data=None, endpoint=None):
        self.cursor.execute("""
            INSERT INTO login_attempts (ip_address, email, attempt_time, success, attack_type, user_agent, request_data, endpoint)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """, (ip_address, email, datetime.now(), success, attack_type, user_agent, request_data, endpoint))
        self.db.commit()

    def check_brute_force(self, ip_address):
        now = datetime.now()
        window_start = now - timedelta(seconds=DETECTION_THRESHOLDS['BRUTE_FORCE']['time_window'])
        
        self.cursor.execute("""
            SELECT COUNT(*) FROM login_attempts 
            WHERE ip_address = %s AND attempt_time > %s AND success = 0
        """, (ip_address, window_start))
        
        failed_attempts = self.cursor.fetchone()[0]
        return failed_attempts >= DETECTION_THRESHOLDS['BRUTE_FORCE']['max_attempts']

    def check_suspicious_patterns(self, request_data):
        # Debug logging
        logging.info(f"Checking suspicious patterns in: {request_data}")
        
        # Check for common attack patterns
        suspicious_patterns = [
            (r'(\%27)|(\')|(\-\-)|(\%23)|(#)', 'SQL Injection'),
            (r'<script.*?>.*?</script>', 'XSS Attack'),
            (r'(\%2E\%2E\%2F)|(\.\.\/)|(\.\.\\)', 'Directory Traversal'),
            (r'(\|\||\&\&|\;|\`|\$)', 'Command Injection'),
            (r'(\%00|\x00)', 'Null Byte Injection'),
            (r'(union\s+select|select\s+.*\s+from|insert\s+into|update\s+.*\s+set|delete\s+from)', 'SQL Injection'),
            (r'(document\.|window\.|eval\(|alert\(|prompt\(|confirm\()', 'XSS Attack'),
            (r'(\.\.\/|\.\.\\|\.\.\/\.\.\/)', 'Path Traversal'),
            (r'(system\(|exec\(|shell_exec\(|passthru\(|popen\()', 'Command Injection'),
            (r'(<.*?on\w+=.*?>|javascript:|vbscript:|data:text/html)', 'XSS Attack'),
            (r'(\bor\b|\band\b|\bunion\b|\bselect\b|\bfrom\b|\bwhere\b|\binsert\b|\bupdate\b|\bdelete\b)', 'SQL Injection'),
            (r'(<img|<iframe|<object|<embed|<svg|<form|<input|<button|<a\s+href)', 'XSS Attack'),
            (r'(\.\.\/|\.\.\\|\.\.\/\.\.\/|\.\.%2F|\.\.%5C)', 'Path Traversal'),
            (r'(;|\||&|`|\$|\(|\)|\{|\}|\[|\]|\'|\"|<|>)', 'Command Injection')
        ]
        
        for pattern, attack_type in suspicious_patterns:
            if re.search(pattern, request_data, re.IGNORECASE):
                logging.warning(f"Pattern match found - Type: {attack_type}, Pattern: {pattern}")
                return attack_type, 'HIGH'
        return None, None

    def check_behavioral_anomalies(self, ip_address, request_data):
        # Check for rapid successive attempts
        now = datetime.now()
        if ip_address in self.last_login_attempt:
            time_diff = (now - self.last_login_attempt[ip_address]).total_seconds()
            if time_diff < 1:  # Less than 1 second between attempts
                return 'RAPID_ATTEMPTS', 'HIGH'
        
        # Check for unusual request patterns
        if len(request_data) > 1000:  # Unusually large request
            return 'LARGE_REQUEST', 'MEDIUM'
            
        # Check for unusual content types
        if 'Content-Type' in request.headers:
            content_type = request.headers['Content-Type']
            if not content_type.startswith('application/json'):
                return 'INVALID_CONTENT_TYPE', 'MEDIUM'
            
        self.last_login_attempt[ip_address] = now
        return None, None

    def is_login_endpoint(self, path):
        return any(path.startswith(endpoint) for endpoint in ADMIN_LOGIN_ENDPOINTS)

    def setup_routes(self):
        # Test endpoint
        @self.app.route('/test')
        def test():
            logging.info("Test endpoint accessed")
            return jsonify({
                'status': 'success',
                'message': 'Gateway is working!',
                'frontend': 'http://localhost:3000',
                'backend': self.target_url
            })

        # Handle all requests
        @self.app.route('/', defaults={'path': ''}, methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
        @self.app.route('/<path:path>', methods=['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'])
        def proxy(path):
            logging.info(f"=== Request Received ===")
            logging.info(f"Path: {path}")
            logging.info(f"Method: {request.method}")
            logging.info(f"Headers: {dict(request.headers)}")
            
            if request.method == 'OPTIONS':
                return '', 200
                
            return self.handle_request(path)

    def handle_request(self, path):
        method = request.method
        headers = dict(request.headers)
        data = request.get_data()
        ip_address = request.remote_addr

        # Enhanced debug logging
        logging.info(f"=== New Request Details ===")
        logging.info(f"Path: {path}")
        logging.info(f"Method: {method}")
        logging.info(f"IP: {ip_address}")
        logging.info(f"Headers: {headers}")
        logging.info(f"Data: {data}")
        logging.info(f"User Agent: {request.user_agent.string}")
        logging.info(f"Is login endpoint: {self.is_login_endpoint(path)}")
        logging.info(f"Full URL: {request.url}")

        # Check if IP is blocked
        if ip_address in self.blocked_ips:
            logging.warning(f"Blocked IP attempt: {ip_address}")
            return jsonify({
                'error': 'Access denied',
                'reason': 'IP address blocked'
            }), 403

        try:
            # Special handling for admin login endpoints
            if self.is_login_endpoint(path) and method == 'POST':
                logging.info(f"=== ADMIN LOGIN ATTEMPT DETECTED ===")
                logging.info(f"Endpoint: {path}")
                logging.info(f"IP: {ip_address}")
                logging.info(f"Request data: {data}")
                
                # Enhanced brute force detection
                if self.check_brute_force(ip_address):
                    self.blocked_ips.add(ip_address)
                    log_message = f"Brute force attack detected from IP: {ip_address}"
                    logging.warning(log_message)
                    return jsonify({
                        'error': 'Too many failed login attempts. IP has been blocked.',
                        'attack_type': 'BRUTE_FORCE',
                        'severity': 'HIGH'
                    }), 403

                # Enhanced suspicious patterns detection
                attack_type, severity = self.check_suspicious_patterns(str(data))
                if attack_type:
                    logging.warning(f"Attack detected - Type: {attack_type}, Severity: {severity}")
                    logging.warning(f"Attack payload: {data}")
                    self.suspicious_ips.add(ip_address)
                    email = request.json.get('email', 'unknown') if request.is_json else 'unknown'
                    self.log_login_attempt(ip_address, email, False, attack_type, request.user_agent.string, str(data), path)
                    return jsonify({
                        'error': 'Potential security threat detected',
                        'attack_type': attack_type,
                        'severity': severity
                    }), 403

                # Enhanced behavioral anomalies detection
                attack_type, severity = self.check_behavioral_anomalies(ip_address, str(data))
                if attack_type:
                    logging.warning(f"Behavioral anomaly detected - Type: {attack_type}, Severity: {severity}")
                    self.suspicious_ips.add(ip_address)
                    email = request.json.get('email', 'unknown') if request.is_json else 'unknown'
                    self.log_login_attempt(ip_address, email, False, attack_type, request.user_agent.string, str(data), path)
                    return jsonify({
                        'error': 'Suspicious activity detected',
                        'attack_type': attack_type,
                        'severity': severity
                    }), 403

            # Forward the request to the target server
            target_path = urljoin(self.target_url, path)
            logging.info(f"Forwarding request to target: {target_path}")
            
            response = requests.request(
                method=method,
                url=target_path,
                headers=headers,
                data=data,
                params=request.args,
                cookies=request.cookies,
                allow_redirects=False
            )

            # Log successful login attempts
            if self.is_login_endpoint(path) and method == 'POST' and response.status_code == 200:
                email = request.json.get('email', 'unknown') if request.is_json else 'unknown'
                self.log_login_attempt(ip_address, email, True, None, request.user_agent.string, str(data), path)
                logging.info(f"Successful login for email: {email}")

            # Create the response
            excluded_headers = ['content-encoding', 'content-length', 'transfer-encoding', 'connection']
            headers = [(name, value) for (name, value) in response.raw.headers.items()
                      if name.lower() not in excluded_headers]

            return Response(response.content, response.status_code, headers)

        except Exception as e:
            logging.error(f"Error processing request: {str(e)}")
            logging.error(f"Request details - Path: {path}, Method: {method}, IP: {ip_address}")
            return jsonify({'error': str(e)}), 500

    def run(self, host='0.0.0.0', port=1337):
        logging.info(f"Starting gateway server on {host}:{port}")
        self.app.run(host=host, port=port, debug=True)

# Example usage
if __name__ == '__main__':
    TARGET_URL = os.getenv('TARGET_URL', 'http://localhost:5000')
    gateway = APIGateway(TARGET_URL)
    gateway.run() 