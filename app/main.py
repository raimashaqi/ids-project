import re
import logging
import os
from typing import List, Tuple
from scapy.all import sniff, IP, TCP
import mysql.connector
from pyfiglet import Figlet
from tqdm import tqdm

class ThreatDetector:
    def __init__(self, db_config: dict):
        """
        Initialize the Threat Detector with database configuration
        
        :param db_config: Dictionary containing database connection parameters
        """
        try:
            self.mydb = mysql.connector.connect(**db_config)
            self.mycursor = self.mydb.cursor()
            self._create_logs_table()
            print("Database connection established successfully!")
        except mysql.connector.Error as err:
            logging.error(f"Database connection error: {err}")
            raise

    def _create_logs_table(self):
        """Create logs table if not exists"""
        try:
            self.mycursor.execute("""
                CREATE TABLE IF NOT EXISTS logs (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    log_message TEXT NOT NULL,
                    log_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ip_src VARCHAR(45),
                    tcp_sport INT,
                    ip_dst VARCHAR(45),
                    tcp_dport INT,
                    severity VARCHAR(10)
                )
            """)
            self.mydb.commit()
        except mysql.connector.Error as err:
            logging.error(f"Error creating logs table: {err}")

    @staticmethod
    def load_payloads(filepath: str, desc: str) -> List[str]:
        """
        Load attack payloads from a file
        
        :param filepath: Path to payload file
        :param desc: Description for progress bar
        :return: List of escaped payloads
        """
        try:
            with open(filepath, 'r', encoding='utf-8') as file:
                return [re.escape(line.strip()) for line in tqdm(file, desc=desc)]
        except FileNotFoundError:
            logging.error(f"Payload file not found: {filepath}")
            return []

    def log_attack(self, attack_type: str, payload: str, ip_src: str, 
                   tcp_sport: int, ip_dst: str, tcp_dport: int):
        """
        Log detected attack to database
        
        :param attack_type: Type of attack detected
        :param payload: Specific payload that triggered detection
        """
        log_msg = f"{attack_type} Attack Detected! Payload: {payload}"
        try:
            sql = """
            INSERT INTO logs (log_message, ip_src, tcp_sport, ip_dst, tcp_dport, severity) 
            VALUES (%s, %s, %s, %s, %s, %s)
            """
            self.mycursor.execute(sql, (log_msg, ip_src, tcp_sport, ip_dst, tcp_dport, 'HIGH'))
            self.mydb.commit()
            print(log_msg)
        except mysql.connector.Error as err:
            logging.error(f"Database logging error: {err}")

    def detect_payload(self, input_payload: str, attack_payloads: List[str]) -> str:
        """
        Detect full payload matches with word boundaries
        
        :param input_payload: Packet payload to check
        :param attack_payloads: List of known attack payloads
        :return: Matched payload or None
        """
        for payload in attack_payloads:
            # Use regex with word boundaries to match full payload
            pattern = r'\b' + re.escape(payload) + r'\b'
            if re.search(pattern, input_payload, re.IGNORECASE):
                return payload
        return None
    


    def analyze_packet(self, packet):
        """
        Enhanced packet analysis with improved payload detection
        """
        if IP not in packet or TCP not in packet:
            return

        try:
            payload = bytes(packet[TCP].payload).decode('utf-8', errors='ignore').strip()
        except UnicodeDecodeError:
            return

        # Extract packet details
        ip_src = packet[IP].src
        ip_dst = packet[IP].dst
        tcp_sport = packet[TCP].sport
        tcp_dport = packet[TCP].dport

        # Attack payload types
        payload_types = [
            ('CRLF Injection', self.crlf_payloads),
            ('CSV Injection', self.csv_payloads),
            ('Command Injection', self.command_injection_payloads),
            ('Directory Traversal', self.directory_traversal_payloads),
            ('File Inclusion', self.file_inclusion_payloads),
            ('LDAP Injection', self.ldap_injection_payloads),
            ('NoSQL Injection', self.nosql_injection_payloads),
            ('SQL Injection', self.sqli_payloads),
            ('SST Injection', self.ssti_payloads),
            ('SSI Injection', self.ssii_payloads),
            ('XSS Injection', self.xss_payloads),
            ('XML Injection', self.xml_payloads)
        ]

        # Check for payload matches
        for attack_type, attack_payloads in payload_types:
            detected_payload = self.detect_payload(payload, attack_payloads)
            if detected_payload:
                self.log_attack(attack_type, detected_payload, ip_src, tcp_sport, ip_dst, tcp_dport)
                return

    def start_monitoring(self):
        """Start network packet monitoring"""
        print("Server is running...")
        sniff(prn=self.analyze_packet)

def main():
    # Logging configuration
    logging.basicConfig(
        level=logging.INFO, 
        format='%(asctime)s - %(levelname)s: %(message)s',
        filename='threat_detector.log'
    )

    # Database configuration
    db_config = {
        'host': 'localhost',
        'user': 'root',
        'password': '',
        'database': 'ymp'
    }

    # Banner
    f = Figlet()
    print(f.renderText("Threats_Detector"))
    print("~# Author: PT. Yuk Mari Proyek Indonesia")
    print("~# Copyright © 2025")

    # Base directory for payload files
    base_dir = os.path.join(os.path.dirname(__file__), 'static', 'payload')

    try:
        detector = ThreatDetector(db_config)
        
        # Dynamically load payload files
        detector.sqli_payloads = detector.load_payloads(os.path.join(base_dir, 'sqli_attack.txt'), "Loading SQLi Payload")
        detector.xss_payloads = detector.load_payloads(os.path.join(base_dir, 'xss_attack.txt'), "Loading XSS Payload")
        detector.crlf_payloads = detector.load_payloads(os.path.join(base_dir, 'crlf_attack.txt'), "Loading CRLF Payload")
        detector.csv_payloads = detector.load_payloads(os.path.join(base_dir, 'csv_attack.txt'), "Loading CSV Payload")
        detector.command_injection_payloads = detector.load_payloads(os.path.join(base_dir, 'command_injection_attack.txt'), "Loading Command Injection Payload")
        detector.directory_traversal_payloads = detector.load_payloads(os.path.join(base_dir, 'directory_traversal_attack.txt'), "Loading Directory Traversal Payload")
        detector.file_inclusion_payloads = detector.load_payloads(os.path.join(base_dir, 'file_inclusion_attack.txt'), "Loading File Inclusion Payload")
        detector.nosql_injection_payloads = detector.load_payloads(os.path.join(base_dir, 'nosql_attack.txt'), "Loading NoSQL Injection Payload")
        detector.xml_payloads = detector.load_payloads(os.path.join(base_dir, 'xml_attack.txt'), "Loading XML Payload")
        detector.ssii_payloads = detector.load_payloads(os.path.join(base_dir, 'ssii_attack.txt'), "Loading SSI Payload")
        detector.ssti_payloads = detector.load_payloads(os.path.join(base_dir, 'ssti_attack.txt'), "Loading SSTI Payload")

        detector.start_monitoring()

    except Exception as e:
        logging.error(f"Initialization error: {e}")

if __name__ == '__main__':
    main()