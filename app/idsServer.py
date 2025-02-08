from scapy.all import sniff, IP, TCP
import mysql.connector
from pyfiglet import Figlet
from tqdm import tqdm
import time
import logging
import os
import signal
import sys
from datetime import datetime

# define db
mydb = mysql.connector.connect(
  host="localhost",
  user="root",
  password="",
  database="yuk_mari"
)

# aktifkan sql query MySQL
mycursor = mydb.cursor()

# cek jika db dah aktif
if mydb.is_connected():
    print("CONNECT!")

    # kemudian eksekusi untuk buat tabel
    # dengan kolum id, log_message, log_time, ip_src, tcp_sport, ip_dst, tcp_dport, severity
    mycursor.execute(
        """
        CREATE TABLE IF NOT EXISTS logs (
            id INT AUTO_INCREMENT PRIMARY KEY,
            log_message TEXT NOT NULL,
            log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            ip_src VARCHAR(45),
            tcp_sport INT,
            ip_dst VARCHAR(45),
            tcp_dport INT,
            severity VARCHAR(10)
        );
        """
    )

# untuk mencatat semua log ke file dengan library logging
logging.basicConfig(filename='logs.txt', level=logging.INFO)

# banner
def banner():
    f = Figlet()
    print(f.renderText("Threats_Detector"))
    print("~# Author: PT. Yuk Mari Proyek Indonesia")
    print("~# Copyright © 2025")

# Define variabel payload untuk setiap kerentanan secara dinamis
payload_files = {
    'SQL Injection': ('sqli_attack.txt', 'CRITICAL'),
    'XSS Injection': ('xss_attack.txt', 'MEDIUM'),
    'XML Injection': ('xml_attack.txt', 'HIGH'),
    'NoSQL Injection': ('nosql_attack.txt', 'CRITICAL'),
    'File Inclusion': ('file_inclusion_attack.txt', 'MEDIUM'),
    'CSV Injection': ('csv_attack.txt', 'MEDIUM'),
    'Directory Traversal': ('directory_traversal_attack.txt', 'MEDIUM'),
    'SST Injection': ('ssti_attack.txt', 'HIGH'),
    'SSI Injection': ('ssii_attack.txt', 'HIGH'),
    'Command Injection': ('command_injection_attack.txt', 'CRITICAL')
}

# Fungsi untuk mendapatkan path payload
def get_payload_path(filename):
    current_dir = os.path.dirname(os.path.abspath(__file__))
    payload_dir = os.path.join(current_dir, 'static', 'payload')
    return os.path.join(payload_dir, filename)

# Fungsi untuk load payloads
def load_payloads(filepath, desc='Loading payloads'):
    try:
        with open(filepath, 'r', encoding='utf-8') as file:
            lines = file.readlines()
            payloads = []
            for line in tqdm(lines, desc=desc, total=len(lines)):
                payloads.append(r"{}".format(line.strip()))
            return payloads
    except FileNotFoundError:
        print(f"Warning: Payload file not found: {filepath}")
        return []

# Fungsi untuk deteksi payload
# Fungsi untuk deteksi payload
# Fungsi untuk deteksi payload
def detect_attack(input_payload):
    # Normalisasi input untuk menghindari false positive
    normalized_input = input_payload.lower().strip()
    
    for attack_type, (filename, severity) in payload_files.items():
        filepath = get_payload_path(filename)
        attack_payloads = load_payloads(filepath, f"Loading {attack_type} payloads")
        
        # Check if the input matches any of the loaded payloads
        for payload in attack_payloads:
            if payload.lower() in normalized_input:
                return attack_type, severity, payload
        
    return None, None, None

# Fungsi untuk mencatat log
def log_attack(log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity):
    # Dapatkan koneksi database
    mydb, mycursor = get_db_connection()
    
    # Log ke file
    with open('logs.txt', 'a') as f:
        log_entry = f"[{datetime.now()}] {severity} - {log_message}\n"
        f.write(log_entry)
    
    # Simpan ke database
    sql = "INSERT INTO logs (log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity) VALUES (%s, %s, %s, %s, %s, %s)"
    mycursor.execute(sql, (log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity))
    mydb.commit()

# Tambahkan variabel global untuk mengontrol sniffing
running = True

# Fungsi untuk menangani signal interrupt (Ctrl+C)
def signal_handler(sig, frame):
    global running, mydb, mycursor
    print("\nMenghentikan server...")
    running = False
    
    try:
        # Tutup koneksi database dengan aman
        if mydb and mydb.is_connected():
            mycursor.close()
            mydb.close()
            print("Koneksi database ditutup.")
    except Exception as e:
        print(f"Error saat menutup koneksi: {e}")
    
    print("Server berhenti.")
    sys.exit(0)

# Fungsi untuk test payload manual
def test_payload(payload, ip_src="127.0.0.1", tcp_sport=0, ip_dst="127.0.0.1", tcp_dport=0):
    attack_type, severity, detected_payload = detect_attack(payload)
    
    if not attack_type:
        attack_type = "Unknown"
        severity = "LOW"
        detected_payload = payload
    
    log_message = f"{attack_type} Attack Detected! Payload: {detected_payload}"
    log_attack(log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity)
    
    return attack_type, severity

# analisis paket serangan dengan library scapy
def analyze_packet(packet):
    global running
    if not running:
        return True  # Return True akan menghentikan sniffing
    
    if IP in packet and TCP in packet:
        ip_src = packet[IP].src
        ip_dst = packet[IP].dst
        tcp_sport = packet[TCP].sport
        tcp_dport = packet[TCP].dport

        try:
            payload = bytes(packet[TCP].payload).decode('utf-8', errors='ignore')
            if payload:
                attack_type, severity = test_payload(payload, ip_src, tcp_sport, ip_dst, tcp_dport)
                print(f"Detected {attack_type} attack with {severity} severity")
        except UnicodeDecodeError:
            return

# Di bagian atas file, setelah import
# Pastikan koneksi database dibuat saat fungsi dipanggil
def get_db_connection():
    global mydb, mycursor
    if 'mydb' not in globals() or not mydb.is_connected():
        mydb = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="yuk_mari"
        )
        mycursor = mydb.cursor()
    return mydb, mycursor

if __name__ == '__main__':
    mydb, mycursor = get_db_connection()
    try:
        banner()
        # Load semua payload secara dinamis dengan progress bar
        print("\nLoading payload databases...")
        for attack_type, (filename, severity) in payload_files.items():
            filepath = get_payload_path(filename)
            _ = load_payloads(filepath, f"Loading {attack_type} Payload")
        
        # Daftarkan signal handler
        signal.signal(signal.SIGINT, signal_handler)
        signal.signal(signal.SIGTERM, signal_handler)
        print("\nServer is running... (Tekan Ctrl+C untuk menghentikan)")
        
        # Modifikasi sniff untuk berhenti ketika running = False
        while running:
            # Sniff dengan timeout untuk mengecek status running secara berkala
            sniff(prn=analyze_packet, store=0, timeout=1, 
                  stop_filter=lambda _: not running)
            
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)
    except Exception as e:
        print(f"Error: {e}")
        signal_handler(signal.SIGINT, None)