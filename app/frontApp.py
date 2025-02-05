import mysql.connector
from idsServer import payload_types
from flask import Flask, render_template, request, redirect, url_for
from flask_sqlalchemy import SQLAlchemy

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

if __name__ == "__main__":
    app.run(debug=True)