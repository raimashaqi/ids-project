from tqdm import tqdm
import re

payload = 'C:/Users/alfiy/OneDrive/Desktop/IDS/magang-alfian/app/static/payload/crlf_attack.txt'

with open(payload, 'r', encoding='utf-8') as file:
        lines = file.readlines()
        payloads = []
        for line in tqdm(lines, desc="tEST", total=len(lines)):
            payloads.append(re.escape(line.strip()))
            # time.sleep(0.001337)