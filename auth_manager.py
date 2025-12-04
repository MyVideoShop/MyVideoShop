import pickle
import json
import os
from pathlib import Path
from cryptography.fernet import Fernet
from datetime import datetime, timedelta
import base64
from config import Config

class AuthManager:
    def __init__(self, user_id='default'):
        self.user_id = user_id
        self.session_file = Config.SESSIONS_DIR / f'{user_id}_session.pkl'
        self.key_file = Config.SESSIONS_DIR / f'{user_id}_key.key'
        self._ensure_key()
        
    def _ensure_key(self):
        """Stelle sicher, dass ein Verschlüsselungsschlüssel existiert"""
        if not self.key_file.exists():
            key = Fernet.generate_key()
            self.key_file.write_bytes(key)
        
    def _get_cipher(self):
        """Hole den Verschlüsselungscipher"""
        key = self.key_file.read_bytes()
        return Fernet(key)
    
    def save_session(self, driver):
        """Speichere Session-Cookies verschlüsselt"""
        cookies = driver.get_cookies()
        session_data = {
            'cookies': cookies,
            'saved_at': datetime.now().isoformat(),
            'user_agent': driver.execute_script("return navigator.userAgent;")
        }
        
        cipher = self._get_cipher()
        encrypted_data = cipher.encrypt(pickle.dumps(session_data))
        
        with open(self.session_file, 'wb') as f:
            f.write(encrypted_data)
        
        print(f"Session gespeichert für {self.user_id}")
    
    def load_session(self):
        """Lade Session-Cookies"""
        if not self.session_file.exists():
            return None
        
        try:
            cipher = self._get_cipher()
            encrypted_data = self.session_file.read_bytes()
            session_data = pickle.loads(cipher.decrypt(encrypted_data))
            
            # Prüfe ob Session abgelaufen (z.B. älter als 7 Tage)
            saved_at = datetime.fromisoformat(session_data['saved_at'])
            if datetime.now() - saved_at > timedelta(days=7):
                print("Session abgelaufen")
                return None
                
            return session_data
            
        except Exception as e:
            print(f"Fehler beim Laden der Session: {e}")
            return None
    
    def delete_session(self):
        """Lösche gespeicherte Session"""
        if self.session_file.exists():
            self.session_file.unlink()
            return True
        return False
    
    def session_exists(self):
        """Prüfe ob Session existiert"""
        return self.session_file.exists()
