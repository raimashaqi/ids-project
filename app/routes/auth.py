from flask import Blueprint, render_template, request, redirect, url_for, flash, session, jsonify, abort
from app.idsServer import detect_attack, log_attack
from werkzeug.security import check_password_hash, generate_password_hash
from app.models.user import User
from app import db
from app.utils.decorators import login_required
from app.translations import translations
import requests

import random
import socket
import re


SITE_KEY = '6LdA_ugqAAAAANRhelfTEZmF39WC_WPwCdOwufnx'
SECRET_KEY = '6LdA_ugqAAAAAF8bkhqJO1AFw8HqtREhuLLNdhPh'
VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify'


# Define Auth Route

auth_bp = Blueprint('auth', __name__)

# ROuting Login Page

@auth_bp.route('/login', methods=['GET'])
def login_page():
    lang = session.get('lang', 'id')  # Default to Indonesian
    return render_template('login.html', site_key=SITE_KEY, lang=lang, translations=translations[lang])

@auth_bp.route('/set-language/<lang>')
def set_language(lang):
    if lang in ['en', 'id']:
        session['lang'] = lang
    return redirect(request.referrer or url_for('auth.login_page'))

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        # Check reCAPTCHA first
        secret_response = request.form.get('g-recaptcha-response')
        if not secret_response:
            flash('Please complete the reCAPTCHA verification', 'danger')
            return redirect(url_for('auth.login_page'))
            
        verify_response = requests.post(url=f'{VERIFY_URL}?secret={SECRET_KEY}&response={secret_response}').json()
        
        if not verify_response.get('success'):
            flash('reCAPTCHA verification failed. Please try again.', 'danger')
            return redirect(url_for('auth.login_page'))

        # Then proceed with login
        email = request.form.get('email')
        password = request.form.get('password')
        
        if not email or not password:
            flash('Please enter both email and password', 'danger')
            return redirect(url_for('auth.login_page'))
            
        user = User.query.filter_by(email=email).first()
        
        if user and check_password_hash(user.password_hash, password):
            session['user'] = user.email
            flash('Login successful!', 'success')
            return redirect(url_for('main.dashboard'))
        else:
            flash('Invalid email or password', 'danger')
            return redirect(url_for('auth.login_page'))
            
    except Exception as e:
        flash('An error occurred during login. Please try again.', 'danger')
        return redirect(url_for('auth.login_page'))

# Routing Logout Page

@auth_bp.route('/logout')
@login_required
def logout():
    session.clear()
    session.pop('user', None)
    flash('Anda telah logout', 'success')
    return redirect(url_for('auth.login_page'))

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
    email = request.form.get('email')
    password = request.form.get('password')
    
    if not email or not password:
        return jsonify({'success': False, 'message': 'Email and password required'}), 400
        
    user = User.query.filter_by(email=email).first()
    
    if user and check_password_hash(user.password_hash, password):
        session['user'] = user.email
        return jsonify({'success': True, 'redirect': url_for('main.dashboard')})
    else:
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401
    
def is_valid_email(email):
    """Memeriksa apakah email valid dengan regex"""
    email_regex = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(email_regex, email) is not None  # Mengembalikan True/False

@auth_bp.route('/account_settings', methods=['GET', 'POST'])
@login_required
def account_settings():
    user_email = session.get('user')
    user = User.query.filter_by(email=user_email).first()
    
    if not user:
        flash("User tidak ditemukan!", "danger")
        return redirect(url_for("auth.login_page"))

    if request.method == "POST":
        # Ambil data dari form
        new_email = request.form.get("newEmail", "").strip()
        new_password = request.form.get("newPassword", "").strip()
        current_password = request.form.get("currentPassword", "").strip()

        email_changed = False
        password_changed = False

        # Perubahan Email
        if new_email and new_email != user.email:
            if not is_valid_email(new_email):
                flash("Format email tidak valid!", "danger")
                return redirect(url_for("auth.account_settings"))

            existing_user = User.query.filter_by(email=new_email).first()
            if existing_user:
                flash("Email sudah digunakan!", "danger")
                return redirect(url_for("auth.account_settings"))

            user.email = new_email
            email_changed = True  

        # Perubahan Password
        if new_password and current_password:
            if not check_password_hash(user.password_hash, current_password):
                flash("Password lama salah!", "danger")
                return redirect(url_for("auth.account_settings"))

            if len(new_password) < 8:
                flash("Password baru harus minimal 8 karakter!", "danger")
                return redirect(url_for("auth.account_settings"))

            user.password_hash = generate_password_hash(new_password)
            password_changed = True

        # Simpan perubahan jika ada
        if email_changed or password_changed:
            try:
                db.session.commit()
                flash("Perubahan berhasil disimpan!", "success")
            except Exception:
                db.session.rollback()
                flash("Terjadi kesalahan saat menyimpan perubahan!", "danger")

        return redirect(url_for("auth.account_settings"))

    return render_template('account_settings.html', user_email=user.email)
