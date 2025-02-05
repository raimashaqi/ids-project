<<<<<<< Updated upstream
import mysql.connector
from idsServer import payload_types
from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
=======
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
import random
from datetime import datetime
from idsServer import detect_attack, log_attack
>>>>>>> Stashed changes

app = Flask(__name__)

app.config['SQLALCHEMY_DATABASE_URI'] ='mysql://root:@localhost/yuk_mari'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Initialize the SQLAlchemy object
db = SQLAlchemy(app)

# Define the Log model
class Log(db.Model):
    __tablename__ = 'logs'
    id = db.Column(db.Integer, primary_key=True)
    log_message = db.Column(db.Text, nullable=False)
    log_time = db.Column(db.DateTime, server_default=db.func.current_timestamp())
    ip_src = db.Column(db.String(45))
    tcp_sport = db.Column(db.Integer)
    ip_dst = db.Column(db.String(45))
    tcp_dport = db.Column(db.Integer)
    severity = db.Column(db.String(10))

<<<<<<< Updated upstream
# fungsi ambil paket serangan
def fetch_attack_data():
    return Log.query.all()

# load paket serangan dan routing ke index
@app.route('/')
def index():
    data = fetch_attack_data()
    return render_template('index.html', data=data)

# routing test serangan via input dengan method POST
@app.route('/test_input', methods=['POST'])
def test_input():
    test_input = request.form['testInput']
    print(f"Received test input: {test_input}")

    # default severity
    severity = 'INFORMATIVE'

    # jika ada serangan terdeteksi sesuaikan dengan payload
    for attack_name, attack_payloads, attack_severity in payload_types:
        if any(payload in test_input for payload in attack_payloads):
            severity = attack_severity
            break
    
    # simpan ke db
    new_log = Log(
        log_message=test_input,
        ip_src='127.0.0.1',
        tcp_sport=80,
        ip_dst='127.0.0.1',
        tcp_dport=80,
        severity=severity
    )

    db.session.add(new_log)
    db.session.commit()

    # kembalikan hasil di index
    return redirect(url_for('index'))

# routing untuk hapus log
@app.route('/delete_log/<int:log_id>', methods=['POST'])
def delete_log(log_id):
    log_to_delete = Log.query.get(log_id)
    if log_to_delete:
        db.session.delete(log_to_delete)
        db.session.commit()

    return redirect(url_for('index'))
=======
# Model User
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(150), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f"<User {self.email}>"
    
with app.app_context():
    db.create_all()
    print("Database dan tabel berhasil dibuat!")

    # Tambahkan user baru jika belum ada
    if not User.query.filter_by(email="admin@example.com").first():
        new_user = User(email="admin@example.com")
        new_user.set_password("password123")
        db.session.add(new_user)
        db.session.commit()
        print("User berhasil ditambahkan!")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/export')
def export():
    if 'user' not in session:
        flash('Silakan login terlebih dahulu!', 'danger')
        return redirect(url_for('login'))
    try:
        # Ambil data logs yang sama dengan /get_logs
        logs = Log.query.order_by(Log.log_time.desc()).all()
        return render_template('export.html', logs=logs)
    except Exception as e:
        flash('Error mengambil data logs', 'danger')
        return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    if 'user' not in session:
        flash('Silakan login terlebih dahulu!', 'danger')
        return redirect(url_for('login'))
    logs = Log.query.order_by(Log.log_time.desc()).all()
    return render_template('dashboard.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        user = User.query.filter_by(email=email).first()

        if user and user.check_password(password):
            session['user'] = user.email
            flash('Berhasil login', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Email atau Password salah, try again', 'error')
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()
    session.pop('user', None)
    flash('Anda telah logout', 'success')
    return redirect(url_for('login'))

@app.route('/reset_password', methods=['GET', 'POST'])
def reset_password():
    otp_code = None
    if request.method == 'POST':
        email = request.form.get('email')
        if not email:
            flash("Email harus diisi!", "danger")
            return redirect(url_for('reset_password'))

        user = User.query.filter_by(email=email).first()
        if user:
            otp_code = random.randint(100000, 999999)
            session['otp_code'] = otp_code
            session['otp_email'] = email
            flash("Kode login Anda telah dihasilkan!", "info")
            return render_template('resetpass.html', otp_code=otp_code)
        else:
            flash("Email tidak terdaftar!", "danger")
            return redirect(url_for('reset_password'))
    return render_template('resetpass.html', otp_code=otp_code)

@app.route('/delete_log/<int:id>', methods=['DELETE'])
def delete_log(id):
    try:
        if 'user' not in session:
            return jsonify({'success': False, 'message': 'Unauthorized'}), 401

        log = Log.query.get(id)
        if log is None:
            return jsonify({'success': False, 'message': 'Log not found'}), 404

        db.session.delete(log)
        db.session.commit()

        with open('logs.txt', 'a') as f:
            log_entry = f"[{datetime.now()}] LOG DELETED - ID: {id}\n"
            f.write(log_entry)

        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/test_payload', methods=['POST'])
def test_payload():
    try:
        if not request.is_json:
            return jsonify({'success': False, 'message': 'Invalid JSON'}), 400
            
        data = request.get_json()
        payload = data.get('payload')
        
        if not payload:
            return jsonify({'success': False, 'message': 'Payload is required'}), 400

        # Gunakan fungsi dari idsServer untuk deteksi
        attack_type, severity, detected_payload = detect_attack(payload)
        
        if not attack_type:
            attack_type = "Unknown"
            severity = "LOW"
            detected_payload = payload
        
        log_message = f"{attack_type} Attack Detected! Payload: {detected_payload}"
        
        # Gunakan fungsi dari idsServer untuk logging
        log_attack(log_message, "127.0.0.1", 0, "127.0.0.1", 0, severity)
        
        return jsonify({
            'success': True,
            'attack_type': attack_type,
            'severity': severity
        })
        
    except Exception as e:
        print(f"Error in test_payload: {str(e)}")  # Untuk debugging
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/get_logs')
def get_logs():
    try:
        logs = Log.query.order_by(Log.log_time.desc()).all()
        logs_list = []
        for log in logs:
            logs_list.append({
                'id': log.id,
                'log_message': log.log_message,
                'log_time': log.log_time.isoformat(),
                'ip_src': log.ip_src,
                'tcp_sport': log.tcp_sport,
                'ip_dst': log.ip_dst,
                'tcp_dport': log.tcp_dport,
                'severity': log.severity
            })
        return jsonify(logs_list)
    except Exception as e:
        print(f"Error in get_logs: {str(e)}")
        return jsonify([])

@app.route('/login_user')
def login_user():
    return render_template('loginuser.html')
>>>>>>> Stashed changes

if __name__ == "__main__":
    app.run(debug=True)