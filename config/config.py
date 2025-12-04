import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent.parent

class Config:
    # App-Einstellungen
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-me')
    DEBUG = os.getenv('DEBUG', 'false').lower() == 'true'
    
    # Browser-Einstellungen
    HEADLESS = os.getenv('HEADLESS', 'true').lower() == 'true'
    BROWSER_TIMEOUT = int(os.getenv('BROWSER_TIMEOUT', '30'))
    USER_AGENT = os.getenv('USER_AGENT', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    # Pfade
    CONFIG_DIR = BASE_DIR / 'config'
    SESSIONS_DIR = BASE_DIR / 'sessions'
    SESSIONS_DIR.mkdir(exist_ok=True)
    
    # Konfigurationsdateien
    WEBSITES_FILE = CONFIG_DIR / 'websites.yaml'
    CREDENTIALS_FILE = CONFIG_DIR / 'credentials.yaml'
    TASKS_FILE = CONFIG_DIR / 'tasks.yaml'
    
    # Zeitplanung
    RUN_TIME = os.getenv('RUN_TIME', '09:00')
    TIMEZONE = os.getenv('TIMEZONE', 'Europe/Berlin')
    
    # Render
    PORT = int(os.getenv('PORT', '5000'))
    
    # Verschlüsselung
    ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')
