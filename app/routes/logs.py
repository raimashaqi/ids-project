from flask import Blueprint, jsonify, request
from app.models.log import Log
from app import db
from app.utils.decorators import login_required
from datetime import datetime
from app.idsServer import detect_attack, log_attack
import mysql.connector
import socket
import requests

# Define Logs Route

logs_bp = Blueprint('logs', __name__)

def get_location_from_ip(location):
    """
    Mendapatkan lokasi dari IP address menggunakan API geolocation
    Args:
        location (str): IP address yang akan dicari lokasinya
    Returns:
        str: String berisi informasi lokasi dalam format "City, Region, Country"
    """
    try:
        # Validasi IP address kosong atau None
        if not location or location == "Unknown":
            return "Location not available"
            
        # Handle localhost dan private IP
        if location in ['127.0.0.1', 'localhost', '::1'] or location.startswith('192.168.') or location.startswith('10.'):
            return "Local Network"

        print(f"Attempting to get location for IP: {location}")
        
        # Gunakan ip-api.com dengan timeout 5 detik untuk menghindari hanging
        response = requests.get(f'http://ip-api.com/json/{location}', timeout=5)
        data = response.json()
        print(f"API Response: {data}")
        
        if data['status'] == 'success':
            location_parts = []
            
            # Tambahkan komponen lokasi jika tersedia
            if data.get('city'):
                location_parts.append(data['city'])
            if data.get('regionName'):
                location_parts.append(data['regionName'])
            if data.get('country'):
                location_parts.append(data['country'])
            
            # Jika tidak ada komponen lokasi yang tersedia
            if not location_parts:
                return "Location details not available"
                
            # Gabungkan komponen dengan koma
            return ", ".join(location_parts)
            
        print(f"API request not successful. Status: {data.get('status')}, Message: {data.get('message', 'No message')}")
        return "Location lookup failed"
        
    except requests.Timeout:
        print("Timeout while getting location")
        return "Location service timeout"
    except requests.RequestException as e:
        print(f"Network error while getting location: {str(e)}")
        return "Network error"
    except Exception as e:
        print(f"Error getting location: {str(e)}")
        print(f"Full error details: {type(e).__name__}")
        return "Error getting location"

# Routing Logs Route (JSON)

def determine_severity(severity_value):
    """
    Menentukan dan menormalisasi nilai severity berdasarkan objek severity.
    Jika nilai tidak sesuai dengan kategori yang diharapkan, maka akan mengembalikan 'Informative'.
    
    Args:
        severity_value (str): Nilai severity yang tersimpan di database.
    
    Returns:
        str: Severity yang sudah dinormalisasi.
    """
    if severity_value and isinstance(severity_value, str):
        # Normalisasi: hapus spasi di awal/akhir dan ubah menjadi huruf kecil
        normalized = severity_value.strip().lower()
        if normalized == "critical":
            return "Critical"
        elif normalized == "high":
            return "High"
        elif normalized == "medium":
            return "Medium"
        elif normalized == "low":
            return "Low"
    # Default jika nilai tidak sesuai atau tidak ada
    # return "Informative"

@logs_bp.route('/get_logs')
@login_required
def get_logs():
    try:
        logs = Log.query.order_by(Log.log_time.desc()).all()
        logs_list = []
        for log in logs:
            # Gunakan fungsi determine_severity untuk menormalisasi nilai severity
            normalized_severity = determine_severity(log.severity)
            logs_list.append({
                'id': log.id,
                'log_message': log.log_message,
                'log_time': log.log_time.isoformat(),
                'ip_src': log.ip_src,
                'tcp_sport': log.tcp_sport,
                'ip_dst': log.ip_dst,
                'tcp_dport': log.tcp_dport,
                'severity': normalized_severity,
                'location': log.location
            })
        return jsonify(logs_list)
    except Exception as e:
        print(f"Error in get_logs: {str(e)}")
        return jsonify([])

# Routing Delete Log Route

@logs_bp.route('/delete_log/<int:id>', methods=['DELETE'])
@login_required
def delete_log(id):
    try:
        log = Log.query.get(id)

        if log is None:
            return jsonify({'success': False, 'message': 'Log not found'}), 404

        # Hapus dari db
        db.session.delete(log)
        db.session.commit()

        # Hapus dari tabel logs di MySQL jika masih ada
        try:
            sql = "DELETE FROM logs WHERE id = %s"
            mydb = mysql.connector.connect(
                host="localhost",
                user="root",
                password="",
                database="yuk_mari"
            )
            
            mycursor = mydb.cursor()
            
            mycursor.execute(sql, (id,))
            mydb.commit()

            mycursor.close()
            mydb.close()

        except Exception as e:
            print(f"Error deleting from MySQL: {e}")

        # Log aktivitas penghapusan
        with open('logs.txt', 'a') as f:
            log_entry = f"[{datetime.now()}] LOG DELETED - ID: {id}\n"
            f.write(log_entry)

        return jsonify({'success': True})
    
    except Exception as e:
        print(f"Error in delete_log: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

# Define Test Payload Route

@logs_bp.route('/test_payload', methods=['POST'])
@login_required
def test_payload():
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Invalid JSON'}), 400

        data = request.get_json()
        payload = data.get('payload')

        if not payload:
            return jsonify({'success': False, 'message': 'Payload is required'}), 400

        # 🔹 Get user's real public IP (supports NGROK, proxies, and direct requests)
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)

        # 🔹 Get source & destination ports
        source_port = request.environ.get('REMOTE_PORT', "Unknown")
        destination_port = request.environ.get('SERVER_PORT', "Unknown")

        # 🔹 Get server's public IP
        server_ip = socket.gethostbyname(socket.gethostname())

        # 🔹 Detect attack using IDS
        attack_type, severity, detected_payload = detect_attack(payload)

        if not attack_type:
            attack_type = "Unknown"
            severity = "LOW"
            detected_payload = payload

        log_message = f"{attack_type} Attack Detected!"

        # Get location from IP address using geolocation service
        location = get_location_from_ip(user_ip)

        # 🔹 Log attack with real IPs and ports
        log_attack(log_message, user_ip, source_port, server_ip, destination_port, severity, location)

        return jsonify({
            'success': True,
            'attack_type': attack_type,
            'severity': severity
        })

    except Exception as e:
        print(f"Error in test_payload: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500

    