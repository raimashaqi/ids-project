import os
import json
import hashlib
import hmac
import requests
from flask import current_app

# Midtrans API Configuration
MIDTRANS_SERVER_KEY = os.getenv('MIDTRANS_SERVER_KEY', 'SB-Mid-server-v1L3Qo-dsj00YheU0yE_yJj0')
MIDTRANS_CLIENT_KEY = os.getenv('MIDTRANS_CLIENT_KEY', 'SB-Mid-client-wIfFBYFIMYaIP1cG')
MIDTRANS_MERCHANT_ID = os.getenv('MIDTRANS_MERCHANT_ID', 'G036452451')
MIDTRANS_IS_PRODUCTION = os.getenv('MIDTRANS_IS_PRODUCTION', 'false').lower() == 'true'

# API URLs
BASE_URL = 'https://api.sandbox.midtrans.com' if not MIDTRANS_IS_PRODUCTION else 'https://api.midtrans.com'

def create_midtrans_transaction(transaction_details, customer_details):
    """
    Create a Midtrans transaction and get the Snap token
    """
    headers = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': f'Basic {MIDTRANS_SERVER_KEY}'
    }
    
    payload = {
        'transaction_details': transaction_details,
        'customer_details': customer_details,
        'enabled_payments': [
            'credit_card',
            'bca_va',
            'bni_va',
            'bri_va',
            'gopay',
            'ovo',
            'dana',
            'linkaja'
        ],
        'callbacks': {
            'finish': f'{current_app.config["BASE_URL"]}/payment/finish',
            'error': f'{current_app.config["BASE_URL"]}/payment/error',
            'pending': f'{current_app.config["BASE_URL"]}/payment/pending'
        }
    }
    
    try:
        response = requests.post(
            f'{BASE_URL}/v2/transaction',
            headers=headers,
            json=payload
        )
        response.raise_for_status()
        return response.json().get('token')
    except requests.exceptions.RequestException as e:
        current_app.logger.error(f'Midtrans API Error: {str(e)}')
        raise Exception('Failed to create Midtrans transaction')

def verify_midtrans_notification(notification):
    """
    Verify the Midtrans notification signature
    """
    order_id = notification.get('order_id')
    status_code = notification.get('status_code')
    gross_amount = notification.get('gross_amount')
    server_key = MIDTRANS_SERVER_KEY
    
    # Create signature string
    signature_string = f"{order_id}{status_code}{gross_amount}{server_key}"
    
    # Calculate signature
    signature = hashlib.sha512(signature_string.encode()).hexdigest()
    
    # Compare with notification signature
    return signature == notification.get('signature_key')
