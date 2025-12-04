import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).parent

# Konfiguration
class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-change-in-production')
    SESSION_COOKIE_NAME = 'bot_session'
    
    # Browser
    HEADLESS = os.getenv('HEADLESS', 'true').lower() == 'true'
    BROWSER_TIMEOUT = 30
    
    # Pfade
    SESSIONS_DIR = BASE_DIR / 'sessions'
    SESSIONS_DIR.mkdir(exist_ok=True)
    
    # Ziel-Website
    LOGIN_URL = os.getenv('LOGIN_URL', 'https://example.com/login')
    BASE_URL = os.getenv('BASE_URL', 'https://example.com')
    
    # Render-spezifisch
    PORT = int(os.getenv('PORT', 5000))
    
    # Zeitplanung
    RUN_TIME = os.getenv('RUN_TIME', '09:00')  # Tägliche Ausführungszeit
