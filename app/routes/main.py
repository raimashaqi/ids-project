from flask import Blueprint, render_template, flash, redirect, url_for, session, request, jsonify
from app.utils.decorators import login_required
from app.models.log import Log
from app.models.payload import Payload
from app import db
import pandas as pd
import os

main_bp = Blueprint('main', __name__,
                   static_folder='../static',
                   static_url_path='/static')

@main_bp.route('/testing')
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
        logs = Log.query.order_by(Log.log_time.desc()).all()
        return render_template('export.html', logs=logs)
    except Exception as e:
        flash('Error mengambil data logs', 'danger')
        return redirect(url_for('main.dashboard')) 

@main_bp.route('/importt')
@login_required
def importt():
    payloads = Payload.query.all()
    return render_template('importt.html', payloads=payloads)

@main_bp.route('/delete-payload/<int:id>', methods=['DELETE'])
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
    severity = request.form.get('severity')  # Ambil severity dari form

    # Proses file sesuai kebutuhan
    try:
        if file_extension == 'txt':
            # Baca file .txt dan hitung jumlah baris
            content = file.read().decode('utf-8')  # Membaca konten file
            lines = content.splitlines()  # Memisahkan konten menjadi baris
            jumlah_baris = len(lines)  # Menghitung jumlah baris

            # Simpan data ke database menggunakan model Payload
            log_entry = Payload(nama_payload=nama_payload, jumlah_baris=jumlah_baris)
            db.session.add(log_entry)

        elif file_extension == 'csv':
            df = pd.read_csv(file)
            # Simpan data ke database menggunakan model Payload
            for index, row in df.iterrows():
                log_entry = Payload(nama_payload=row['nama_payload'], jumlah_baris=row['jumlah_baris'])
                db.session.add(log_entry)
        
        elif file_extension == 'xlsx':
            df = pd.read_excel(file)
            # Simpan data ke database menggunakan model Payload
            for index, row in df.iterrows():
                log_entry = Payload(nama_payload=row['nama_payload'], jumlah_baris=row['jumlah_baris'])
                db.session.add(log_entry)

        db.session.commit()

        return jsonify(success=True, payload={'nama_payload': nama_payload, 'jumlah_baris': jumlah_baris})  # Kembalikan data yang diperlukan
    except Exception as e:
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