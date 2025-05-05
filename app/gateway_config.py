import os
from dotenv import load_dotenv

load_dotenv()

# Target website configuration (Backend)
TARGET_URL = os.getenv('TARGET_URL', 'http://localhost:5000')  # Backend port
BACKEND_PORT = int(os.getenv('BACKEND_PORT', 5000))

# Gateway server configuration (IDS)
GATEWAY_HOST = os.getenv('GATEWAY_HOST', '0.0.0.0')
GATEWAY_PORT = int(os.getenv('GATEWAY_PORT', 1337))  # IDS Gateway port

# Security settings
ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
BLOCKED_IPS = os.getenv('BLOCKED_IPS', '').split(',')

# Rate limiting
RATE_LIMIT = int(os.getenv('RATE_LIMIT', 100))  # requests per minute
RATE_LIMIT_WINDOW = int(os.getenv('RATE_LIMIT_WINDOW', 60))  # seconds

# Logging configuration
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FILE = os.getenv('LOG_FILE', 'gateway.log')

# Database configuration
DB_HOST = os.getenv('DB_HOST', 'localhost')
DB_USER = os.getenv('DB_USER', 'root')
DB_PASSWORD = os.getenv('DB_PASSWORD', '')
DB_NAME = os.getenv('DB_NAME', 'yuk_mari')

# SSL/TLS configuration
SSL_CERT = os.getenv('SSL_CERT')
SSL_KEY = os.getenv('SSL_KEY')
FORCE_SSL = os.getenv('FORCE_SSL', 'False').lower() == 'true'

# Admin login endpoints to monitor
ADMIN_LOGIN_ENDPOINTS = [
    '/api/login',
    '/api/admin/login',
    '/api/admins',
    '/api/auth/login',
    '/api/admin',
    '/api/auth',
    '/api/auth/login/admin',
    '/api/admin/auth/login',
    '/api/admins/login',
    '/api/admin/login',  # Duplicate for emphasis
    '/api/admins',       # Duplicate for emphasis
    '/login',           # Generic login path
    '/admin/login',     # Generic admin login path
    '/auth/login',      # Generic auth login path
    '/api/v1/login',    # Versioned API path
    '/api/v1/admin/login',
    '/api/v1/auth/login',
    '/admin',           # Root admin path
    '/auth',            # Root auth path
    '/api/v1/admins',   # Versioned admins path
    '/api/v1/admin',    # Versioned admin path
    '/api/v1/auth'      # Versioned auth path
]

# Attack detection thresholds
DETECTION_THRESHOLDS = {
    'SQL_INJECTION': {
        'max_attempts': 3,
        'time_window': 300  # 5 minutes
    },
    'BRUTE_FORCE': {
        'max_attempts': 5,
        'time_window': 300  # 5 minutes
    },
    'XSS': {
        'max_attempts': 3,
        'time_window': 300
    },
    'COMMAND_INJECTION': {
        'max_attempts': 2,
        'time_window': 300
    }
}

# Logging configuration
LOG_CONFIG = {
    'log_file': 'logs/admin_login_attacks.log',
    'max_file_size': 10485760,  # 10MB
    'backup_count': 5,
    'debug_file': 'logs/gateway_debug.log',
    'level': 'DEBUG'  # Set logging level to DEBUG for more detailed logs
}

# Database configuration
DB_CONFIG = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME
}

# Email notification configuration (optional)
EMAIL_CONFIG = {
    'enabled': False,
    'smtp_server': 'smtp.gmail.com',
    'smtp_port': 587,
    'sender_email': '',
    'sender_password': '',
    'recipient_email': ''
} 