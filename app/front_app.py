from flask import Flask, render_template, request, redirect, url_for
import mysql.connector
from main import payload_types

app = Flask(__name__)

# Database connection
mydb = mysql.connector.connect(
    host="localhost",
    user="root",
    password="",
    database="ymp"
)

mycursor = mydb.cursor()

def fetch_attack_data():
    mycursor.execute("SELECT log_time, log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity, id FROM logs")  # Tambahkan kolom id
    data = mycursor.fetchall()
    return data

@app.route('/')
def index():
    data = fetch_attack_data()
    return render_template('index.html', data=data)

@app.route('/test_input', methods=['POST'])
def test_input():
    test_input = request.form['testInput']
    print(f"Received test input: {test_input}")

    severity = 'INFORMATIVE'

    for attack_type, attack_payloads, attack_severity in payload_types:
        if any(payload in test_input for payload in attack_payloads):
            severity = attack_severity
            break
    
    sql = "INSERT INTO logs (log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity) VALUES (%s, %s, %s, %s, %s, %s)"
    mycursor.execute(sql, (test_input, '127.0.0.1', 80, '127.0.0.1', 80, severity))
    mydb.commit()

    return redirect(url_for('index'))

@app.route('/delete_log/<int:log_id>', methods=['POST'])
def delete_log(log_id):
    sql = "DELETE FROM logs WHERE id = %s"
    mycursor.execute(sql, (log_id,))
    mydb.commit()

    return redirect(url_for('index'))

if __name__ == "__main__":
    app.run(debug=True)