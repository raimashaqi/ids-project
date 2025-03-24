from flask import Blueprint, render_template, flash, redirect, url_for, session, request, jsonify
from app.utils.decorators import login_required
from app.models.log import Log
from app.models.payload import Payload
from app import db
import pandas as pd
import os
import midtransclient
from flask_login import current_user
import random
import string
import requests
from app.routes.auth import SITE_KEY, SECRET_KEY

# Initialize Midtrans Snap
snap = midtransclient.Snap(
    is_production=True,  
    server_key='Mid-server-nQ40waJaQMihHi-DnUtxndLH'  
)

main_bp = Blueprint('main', __name__,
                   static_folder='../static',
                   static_url_path='/static' )

@main_bp.route('/testing')
@login_required
def index():
    try:
        logs = Log.query.order_by(Log.log_time.desc()).all()
        return render_template('testing.html', logs=logs)
    except Exception as e:
        flash('Error mengambil data logs', 'danger')
        return redirect(url_for('auth.login')) 

@main_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/export')
@login_required
def export():
    try:
        print("Accessing export page...")  # Debug print
        print(f"Current user: {session.get('user')}")  # Debug print
        logs = Log.query.order_by(Log.log_time.desc()).all()
        print(f"Found {len(logs)} logs")  # Debug print
        return render_template('export.html', logs=logs)
    except Exception as e:
        print(f"Error in export route: {str(e)}")  # Debug print
        flash('Error mengakses halaman export', 'danger')
        return redirect(url_for('main.dashboard'))

@main_bp.route('/importt')
@login_required
def importt():
    payloads = Payload.query.all()
    return render_template('importt.html', payloads=payloads)

@main_bp.route('/view-payloads', methods=['GET'])
@login_required
def view_payloads():
    """
    Fetches all payload data from the database and displays it in a table.
    """
    try:
        # Query all payload data from the database
        payloads = Payload.query.all()

        # Pass the data to the template for rendering
        return render_template('view_payloads.html', payloads=payloads)
    except Exception as e:
        flash('Error fetching payload data', 'danger')
        return redirect(url_for('main.dashboard'))


@main_bp.route('/delete-payload/<int:id>', methods=['DELETE'])
@login_required
def delete_payload(id):
    payload = Payload.query.get(id)
    if payload:
        db.session.delete(payload)
        db.session.commit()
        return jsonify(success=True)
    return jsonify(success=False, message='Payload not found')

@main_bp.route('/account_settings')
@login_required
def account_settings():
    return render_template('account_settings.html')

@main_bp.route('/buy')
@login_required
def buy():
    return render_template('buy.html', site_key=SITE_KEY)

@main_bp.route('/create-payment', methods=['POST'])
@login_required
def create_payment():
    try:
        # Verify reCAPTCHA first
        secret_response = request.form.get('g-recaptcha-response')
        if not secret_response:
            return jsonify({'success': False, 'message': 'Please complete the reCAPTCHA verification'}), 400
            
        verify_response = requests.post(url=f'https://www.google.com/recaptcha/api/siteverify?secret={SECRET_KEY}&response={secret_response}').json()
        
        if not verify_response.get('success'):
            return jsonify({'success': False, 'message': 'reCAPTCHA verification failed. Please try again.'}), 400

        customer_name = request.form.get('customerName')
        customer_email = request.form.get('customerEmail')
        customer_phone = request.form.get('customerPhone')
        
        if not customer_name:
            return jsonify({'success': False, 'message': 'Customer name is required'}), 400
            
        if not customer_email:
            return jsonify({'success': False, 'message': 'Customer email is required'}), 400
            
        if not customer_phone:
            return jsonify({'success': False, 'message': 'Customer phone is required'}), 400

        # Generate a random order ID
        order_id = ''.join(random.choices(string.ascii_uppercase + string.digits, k=10))

        # Build API parameter
        param = {
            "transaction_details": {
                "order_id": f"ORDER-{order_id}",
                "gross_amount": 1  # Amount in IDR (200,000)
            },
            "credit_card": {
                "secure": True
            },
            "customer_details": {
                "first_name": customer_name,
                "email": customer_email,
                "phone": customer_phone
            }
        }

        # Create transaction
        transaction = snap.create_transaction(param)
        transaction_token = transaction['token']

        return jsonify({
            'success': True,
            'snap_token': transaction_token,
            'order_id': param['transaction_details']['order_id']
        })

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@main_bp.route('/upload-endpoint', methods=['POST'])
@login_required
def upload_file():
    if 'file' not in request.files:
        return jsonify(success=False, message='No file part')
    
    file = request.files['file']
    if file.filename == '':
        return jsonify(success=False, message='No selected file')

    # Validasi ekstensi file
    allowed_extensions = {'txt', 'csv', 'xlsx'}
    file_extension = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
    
    if file_extension not in allowed_extensions:
        return jsonify(success=False, message='Invalid file type. Please upload .txt, .csv, or .xlsx files.')

    nama_payload = request.form.get('nama_payload')  # Ambil nama payload dari form

    try:
        payload_dir = os.path.join('app', 'static', 'payload')
        os.makedirs(payload_dir, exist_ok=True)

        file_path = os.path.join(payload_dir, f"{nama_payload}.{file_extension}")
        
        file.save(file_path)

        # Hitung jumlah baris berdasarkan tipe file
        if file_extension == 'txt':
            with open(file_path, 'r', encoding='utf-8') as f:
                jumlah_baris = sum(1 for line in f)
        elif file_extension in ['csv', 'xlsx']:
            if file_extension == 'csv':
                df = pd.read_csv(file_path)
            else:
                df = pd.read_excel(file_path)
            jumlah_baris = len(df)

        payload = Payload(
            nama_payload=nama_payload,
            jumlah_baris=jumlah_baris
        )
        db.session.add(payload)
        db.session.commit()

        return jsonify(success=True, payload={
            'id': payload.id,
            'nama_payload': nama_payload,
            'jumlah_baris': jumlah_baris
        })

    except Exception as e:
        # Jika terjadi error, hapus file jika sudah terupload
        if os.path.exists(file_path):
            os.remove(file_path)
        print(f"Error in upload_file: {str(e)}")  # Debug log
        return jsonify(success=False, message=str(e))

@main_bp.route('/get_log_data', methods=['GET'])
@login_required
def get_log_data():
    try:
        logs = Log.query.all()
        severity_count = {
            'Informative': 0,
            'Low': 0,
            'Medium': 0,
            'High': 0,
            'Critical': 0
        }

        for log in logs:
            severity_count[log.severity] += 1

        return jsonify(severity_count)
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500
    
@main_bp.route('/delete-log/<int:id>', methods=['POST', 'DELETE'])
@login_required
def delete_log(id):
    """
    Deletes a log entry from the database based on its ID.
    """
    try:
        # Query the log entry by ID
        log_entry = Log.query.get(id)
        
        # Check if the log entry exists
        if not log_entry:
            return jsonify(success=False, message='Log entry not found'), 404
        
        # Delete the log entry
        db.session.delete(log_entry)
        db.session.commit()

        return jsonify(success=True, message='Log entry deleted successfully')
    except Exception as e:
        return jsonify(success=False, message=str(e)), 500

@main_bp.route('/get-payloads', methods=['GET'])
@login_required
def get_payloads():
    """
    Returns all payload data as JSON for table refresh
    """
    try:
        payloads = Payload.query.all()
        payload_list = [{
            'id': p.id,
            'nama_payload': p.nama_payload,
            'jumlah_baris': p.jumlah_baris
        } for p in payloads]
        return jsonify({'success': True, 'payloads': payload_list})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@main_bp.route('/get-payload-content/<int:id>', methods=['GET'])
@login_required
def get_payload_content(id):
    """
    Returns the content of a specific payload file
    """
    try:
        # Get the payload from database
        payload = Payload.query.get(id)
        print(f"Looking for payload with ID: {id}")
        print(f"Found payload: {payload}")
        
        if not payload:
            return jsonify({'success': False, 'message': 'Payload not found'}), 404

        # Get the file path based on payload name
        current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        payload_dir = os.path.join(current_dir, 'static', 'payload')
        print(f"Looking in directory: {payload_dir}")
        print(f"Payload name: {payload.nama_payload}")
        
        # Try different possible file extensions
        possible_extensions = ['.txt', '.csv', '.xlsx']
        file_path = None
        
        for ext in possible_extensions:
            temp_path = os.path.join(payload_dir, payload.nama_payload + ext)
            print(f"Trying path: {temp_path}")
            print(f"File exists: {os.path.exists(temp_path)}")
            if os.path.exists(temp_path):
                file_path = temp_path
                break
        
        if not file_path:
            return jsonify({'success': False, 'message': f'Payload file not found. Looked in {payload_dir} for {payload.nama_payload}'}), 404

        # Read the file content
        content = []
        if file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as file:
                content = file.read().splitlines()
        elif file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
            content = df.values.tolist()
        elif file_path.endswith('.xlsx'):
            df = pd.read_excel(file_path)
            content = df.values.tolist()

        return jsonify({
            'success': True,
            'content': content
        })

    except Exception as e:
        print(f"Error in get_payload_content: {str(e)}")
        return jsonify({'success': False, 'message': str(e)}), 500
