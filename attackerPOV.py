from scapy.all import IP, TCP, send

target_ip = "192.168.137.1"  # mesin IDS
target_port = 80

attacker_ip = "192.168.0.5" # mesin attacker
attacker_port = 80

xss_payload = "<script>"

ip_layer = IP(src=attacker_ip, dst=target_ip)
tcp_layer = TCP(sport=attacker_port, dport=target_port)

payload = xss_payload

# buat paket
packet = ip_layer / tcp_layer / payload

if __name__ == "__main__":
    send(packet)
    print(f"Sent XSS attack packet to {target_ip}:{target_port}")
