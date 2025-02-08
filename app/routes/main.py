from flask import Blueprint, render_template, flash, redirect, url_for, session
from app.utils.decorators import login_required
from app.models.log import Log

main_bp = Blueprint('main', __name__,
                   static_folder='../static',
                   static_url_path='/static')

@main_bp.route('/')
def index():
    return render_template('index.html')

@main_bp.route('/dashboard')
@login_required
def dashboard():
    return render_template('dashboard.html')

@main_bp.route('/export')
@login_required
def export():
    return render_template('export.html')

@main_bp.route('/importt')
@login_required
def importt():
    return render_template('importt.html')
    # try:
    #     logs = Log.query.order_by(Log.log_time.desc()).all()
    #     return render_template('importt.html', logs=logs)
    # except Exception as e:
    #     flash('Error mengambil data logs', 'danger')
    #     return redirect(url_for('main.dashboard')) 

@main_bp.route('/account_settings')
@login_required
def account_settings():
    return render_template('account_settings.html')