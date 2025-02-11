from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from app.idsServer import detect_attack, log_attack
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.user import User
from app import db

import random
import socket
import re


# Define Auth Route

auth_bp = Blueprint('auth', __name__)

# ROuting Login Page

# ROuting Login Page

@auth_bp.route('/', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session['user'] = user.email
            flash('Berhasil login', 'success')
            return redirect(url_for('main.dashboard'))
        else:
            flash('Email atau Password salah', 'error')
    return render_template('login.html')

# Routing Logout Page

# Routing Logout Page

@auth_bp.route('/logout')
def logout():
    session.clear()
    session.pop('user', None)
    flash('Anda telah logout', 'success')
    return redirect(url_for('auth.login'))

# Routing Reset Password Page

# Routing Reset Password Page

@auth_bp.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    otp_code = None
    if request.method == 'POST':
        email = request.form.get('email')
        if not email:
            flash("Email harus diisi!", "danger")
            return redirect(url_for('auth.reset_password'))

        user = User.query.filter_by(email=email).first()
        if user:
            otp_code = random.randint(100000, 999999)
            session['otp_code'] = otp_code
            session['otp_email'] = email
            flash("Kode login Anda telah dihasilkan!", "info")
            return render_template('resetpass.html', otp_code=otp_code)
        else:
            flash("Email tidak terdaftar!", "danger")
            return redirect(url_for('auth.reset_password'))
    return render_template('resetpass.html', otp_code=otp_code)

# Routing Client Apps

@auth_bp.route('/client', methods=['GET', 'POST'])
def client():
    if request.method == 'POST':
        if request.is_json:
            data = request.get_json()
            email = data.get('email')
            password = data.get('password')
        else:
            email = request.form.get('email')
            password = request.form.get('password')

        # 🔹 Get user's real public IP (supports NGROK, proxies, and direct requests)
        user_ip = request.headers.get('X-Forwarded-For', request.remote_addr)

        # 🔹 Get source & destination ports
        source_port = request.environ.get('REMOTE_PORT', "Unknown")
        destination_port = request.environ.get('SERVER_PORT', "Unknown")

        # 🔹 Get server's public IP
        server_ip = socket.gethostbyname(socket.gethostname())

        # IDS detection
        attack_type, severity = detect_attack(email + " " + password)
        if attack_type:
            log_message = f"{attack_type} Attack Detected!"
            log_attack(log_message, user_ip, source_port, server_ip, destination_port, severity)

            return jsonify({'success': False, 'message': 'Suspicious activity detected!'}), 403

        # Normal login
        user = User.query.filter_by(email=email).first()
        if user and user.check_password(password):
            session['user'] = user.email
            return jsonify({'success': True, 'redirect': url_for('main.dashboard')})
        else:
            return jsonify({'success': False, 'message': 'Invalid email or password'}), 401

    return render_template('client.html')

def is_valid_email(email):
    """Memeriksa apakah email valid dengan regex"""
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(email_regex, email)

@auth_bp.route('/account_settings', methods=['GET', 'POST'])
def account_settings():
    user_email = session.get('user')

    # Pastikan user sudah login
    if not user_email:
        flash("Silakan login terlebih dahulu!", "danger")
        return redirect(url_for("auth.login"))

    user = User.query.filter_by(email=user_email).first()
    
    if not user:
        flash("User tidak ditemukan!", "danger")
        return redirect(url_for("auth.login"))

    if request.method == "POST":
        
        print("[DEBUG] Data Form Diterima:", request.form)

        new_email = request.form.get("newEmail")
        new_password = request.form.get("newPassword")
        current_password = request.form.get("currentPassword")

        print(f"[DEBUG] New Email: {new_email}")
        print(f"[DEBUG] Current Password: {current_password}")
        print(f"[DEBUG] New Password: {new_password}")

        # Ganti Email
        if new_email and new_email != user.email:  # Hanya jalankan jika email benar-benar berubah
            print("[DEBUG] Memulai proses ubah Email...")

            if not is_valid_email(new_email):
                flash("Format email tidak valid!", "danger")
                return redirect(url_for("auth.account_settings"))

            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user:
                flash("Email sudah digunakan!", "danger")
                return redirect(url_for("auth.account_settings"))

            print(f"[DEBUG] Email lama: {user.email}")
            print(f"[DEBUG] Email baru: {new_email}")

            user.email = new_email  
            session["user"] = new_email  # Update session


        # Ganti Password
        if new_password and current_password:
            print("[DEBUG] Memulai proses ubah password...")

            # Periksa apakah password lama sesuai
            if not check_password_hash(user.password_hash, current_password):
                print("[ERROR] Password lama tidak cocok!")
                flash("Password lama salah!", "danger")
                return redirect(url_for("auth.account_settings"))

            # Validasi panjang password baru
            if len(new_password) < 8:
                print("[ERROR] Password baru terlalu pendek!")
                flash("Password baru harus minimal 8 karakter!", "danger")
                return redirect(url_for("auth.account_settings"))

            # Simpan password baru (hashing)
            hashed_password = generate_password_hash(new_password)
            print(f"[DEBUG] Password baru hashed: {hashed_password}")

            user.password_hash = hashed_password

        try:
            db.session.commit()  # Simpan perubahan ke database
            print("[DEBUG] Data berhasil disimpan ke database!")
            flash("Perubahan berhasil disimpan!", "success")
        except Exception as e:
            db.session.rollback()  # Jika ada error, batalkan perubahan
            print(f"[ERROR] Terjadi kesalahan saat menyimpan: {e}")
            flash("Terjadi kesalahan saat menyimpan perubahan!", "danger")

        return redirect(url_for("auth.account_settings"))

    return render_template('account_settings.html', user_email=user.email)
