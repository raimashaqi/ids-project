from flask import Blueprint, render_template, flash, redirect, url_for
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
    try:
        logs = Log.query.order_by(Log.log_time.desc()).all()
        return render_template('dashboard.html', logs=logs)
    except Exception as e:
        flash('Error mengambil data logs', 'danger')
        return redirect(url_for('main.index'))

@main_bp.route('/export')
@login_required
def export():
    try:
        logs = Log.query.order_by(Log.log_time.desc()).all()
        return render_template('export.html', logs=logs)
    except Exception as e:
        flash('Error mengambil data logs', 'danger')
        return redirect(url_for('main.dashboard')) 