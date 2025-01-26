from tqdm import tqdm

def read_xss_patterns(filepath):
    with open(filepath, 'r') as file:
        lines = file.readlines()
        for line in tqdm(lines, desc="Reading XSS patterns", total=len(lines)):
            pass

# Contoh penggunaan fungsi
if __name__ == "__main__":
    filepath = 'C:/Users/alfiy/OneDrive/Desktop/IDS/magang-alfian/app/static/payload/xml_attack.txt'
    raw_patterns = read_xss_patterns(filepath)
    print(raw_patterns)