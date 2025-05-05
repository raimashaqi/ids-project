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

# === LOAD ALL PAYLOADS TO MEMORY ONCE ===
loaded_payloads = {}
for attack_type, (filename, severity) in payload_files.items():
    filepath = get_payload_path(filename)
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            loaded_payloads[attack_type] = [line.strip().lower() for line in f if line.strip()]
    except FileNotFoundError:
        print(f"Warning: Payload file not found: {filepath}")
        loaded_payloads[attack_type] = []

# Fungsi untuk deteksi payload
def detect_attack(input_payload):
    print(f"[DEBUG] Original input: {input_payload}")
    normalized_input = input_payload.lower().strip()
    print(f"[DEBUG] Normalized input: {normalized_input}")
    for attack_type, payloads in loaded_payloads.items():
        for payload in payloads:
            if payload in normalized_input:
                severity = payload_files[attack_type][1]
                print(f"[DEBUG] Attack detected! Type: {attack_type}, Payload: {payload}")
                return attack_type, severity, payload
    print("[DEBUG] No attack detected")
    return None, None, None

# Fungsi untuk mencatat log
def log_attack(log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity, location):
    # Dapatkan koneksi database
    mydb, mycursor = get_db_connection()
    
    # Log ke file
    with open('logs.txt', 'a') as f:
        log_entry = f"[{datetime.now()}] {severity} - {log_message}\n"
        f.write(log_entry)
    
    # Simpan ke database
    sql = "INSERT INTO logs (log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity, location) VALUES (%s, %s, %s, %s, %s, %s, %s)"
    mycursor.execute(sql, (log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity, location))
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
    log_attack(log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity, location)
    
    return attack_type, severity

# analisis paket serangan dengan library scapy
def analyze_packet(packet):
    global running
    if not running:
        return True
    
    if IP in packet and TCP in packet:
        ip_src = packet[IP].src
        ip_dst = packet[IP].dst
        tcp_sport = packet[TCP].sport
        tcp_dport = packet[TCP].dport

        # Fokus pada port admin (3000)
        if tcp_dport != 3000:
            return

        try:
            payload = bytes(packet[TCP].payload).decode('utf-8', errors='ignore')
            if payload:
                # Deteksi serangan login
                if '/api/auth/login' in payload:
                    # Deteksi brute force
                    if 'password' in payload.lower():
                        log_message = f"Login attempt from {ip_src}"
                        log_attack(log_message, ip_src, tcp_sport, ip_dst, tcp_dport, "MEDIUM", "Login Attempt")
                
                # Deteksi serangan umum
                attack_type, severity = test_payload(payload, ip_src, tcp_sport, ip_dst, tcp_dport)
                if attack_type != "Unknown":
                    print(f"[ALERT] Detected {attack_type} attack from {ip_src} with {severity} severity")
                    log_attack(f"{attack_type} Attack Detected", ip_src, tcp_sport, ip_dst, tcp_dport, severity, "Admin API")
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
            _ = loaded_payloads[attack_type]
        
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