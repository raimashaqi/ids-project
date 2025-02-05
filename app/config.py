from dotenv import load_dotenv
import os

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'amanbangetgess')
    SQLALCHEMY_DATABASE_URI = f"mysql://{os.getenv('DB_USER')}:{os.getenv('DB_PASSWORD')}@{os.getenv('DB_HOST')}/{os.getenv('DB_NAME')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv('FLASK_RUN_PORT', 1337))
    SEND_FILE_MAX_AGE_DEFAULT = 0  # Disable caching during development 