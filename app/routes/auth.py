from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify
from app.idsServer import detect_attack, log_attack
from app.models.user import User
import random
import socket

# Define Auth Route

auth_bp = Blueprint('auth', __name__)

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

@auth_bp.route('/logout')
def logout():
    session.clear()
    session.pop('user', None)
    flash('Anda telah logout', 'success')
    return redirect(url_for('auth.login'))

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
