from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from app.models.user import User
from app import db
import random

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['GET', 'POST'])
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

@auth_bp.route('/logout')
def logout():
    session.clear()
    session.pop('user', None)
    flash('Anda telah logout', 'success')
    return redirect(url_for('auth.login'))

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