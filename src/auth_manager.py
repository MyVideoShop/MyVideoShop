import pickle
import json
import os
from pathlib import Path
from cryptography.fernet import Fernet, InvalidToken
from datetime import datetime, timedelta
import base64
import yaml
from config.config import Config
from src.utils import ConfigLoader

class EncryptionManager:
    """Handhabt die Verschlüsselung von sensiblen Daten"""
    
    def __init__(self):
        self.key = self._get_or_create_key()
        self.cipher = Fernet(self.key)
    
    def _get_or_create_key(self) -> bytes:
        """Hole oder erstelle Verschlüsselungsschlüssel"""
        key_env = Config.ENCRYPTION_KEY
        
        if key_env:
            # Base64 dekodieren
            try:
                return base64.urlsafe_b64decode(key_env)
            except:
                # Wenn nicht base64, direkt verwenden (32 Bytes erfordert)
                key = key_env.encode()
                if len(key) != 32:
                    # Auffüllen auf 32 Bytes
                    key = key.ljust(32, b'0')[:32]
                return key
        else:
            # Generiere neuen Schlüssel
            key = Fernet.generate_key()
            print(f"WARNUNG: Kein ENCRYPTION_KEY gesetzt. Verwende temporären Schlüssel.")
            print(f"Setze diese Variable dauerhaft (z.B. in .env):")
            print(f"ENCRYPTION_KEY={base64.urlsafe_b64encode(key).decode()}")
            return key
    
    def encrypt(self, data: str) -> str:
        """Verschlüssele Daten"""
        encrypted = self.cipher.encrypt(data.encode())
        return base64.urlsafe_b64encode(encrypted).decode()
    
    def decrypt(self, encrypted_data: str) -> str:
        """Entschlüssele Daten"""
        try:
            encrypted_bytes = base64.urlsafe_b64decode(encrypted_data.encode())
            decrypted = self.cipher.decrypt(encrypted_bytes)
            return decrypted.decode()
        except InvalidToken:
            raise ValueError("Ungültiges oder beschädigtes Verschlüsselungstoken")
    
    def is_encrypted(self, data: str) -> bool:
        """Prüfe ob Daten verschlüsselt sind"""
        return data.startswith("ENCRYPTED:")

class AuthManager:
    def __init__(self, user_id='default', website_id='main'):
        self.user_id = user_id
        self.website_id = website_id
        self.session_file = Config.SESSIONS_DIR / f'{user_id}_{website_id}_session.pkl'
        self.encryption = EncryptionManager()
        
    def get_credentials(self):
        """Hole Anmeldedaten aus der Konfiguration"""
        credentials = ConfigLoader.load_credentials()
        
        if self.user_id not in credentials.get('users', {}):
            raise ValueError(f"Benutzer '{self.user_id}' nicht in credentials.yaml gefunden")
        
        user_data = credentials['users'][self.user_id]
        
        if 'websites' not in user_data or self.website_id not in user_data['websites']:
            raise ValueError(f"Webseite '{self.website_id}' für Benutzer '{self.user_id}' nicht gefunden")
        
        creds = user_data['websites'][self.website_id].copy()
        
        # Prüfe ob Passwort verschlüsselt werden muss
        if 'password' in creds and creds['password'].startswith('PLAIN:'):
            plain_password = creds['password'][6:]  # Entferne 'PLAIN:'
            # Verschlüssele und speichere
            creds['password'] = f"ENCRYPTED:{self.encryption.encrypt(plain_password)}"
            self._update_credentials_file(creds)
        
        # Entschlüssele Passwort wenn nötig
        if 'password' in creds and creds['password'].startswith('ENCRYPTED:'):
            encrypted = creds['password'][10:]  # Entferne 'ENCRYPTED:'
            creds['password'] = self.encryption.decrypt(encrypted)
        
        return creds
    
    def _update_credentials_file(self, updated_creds):
        """Aktualisiere die credentials.yaml Datei mit verschlüsselten Passwörtern"""
        credentials = ConfigLoader.load_credentials()
        
        if self.user_id in credentials.get('users', {}):
            if self.website_id in credentials['users'][self.user_id].get('websites', {}):
                credentials['users'][self.user_id]['websites'][self.website_id] = updated_creds
                ConfigLoader.save_yaml(Config.CREDENTIALS_FILE, credentials)
    
    def save_session(self, driver):
        """Speichere Session-Cookies"""
        cookies = driver.get_cookies()
        session_data = {
            'cookies': cookies,
            'saved_at': datetime.now().isoformat(),
            'user_agent': driver.execute_script("return navigator.userAgent;"),
            'website_id': self.website_id,
            'user_id': self.user_id
        }
        
        # Verschlüssle die Session-Daten
        encrypted_data = self.encryption.cipher.encrypt(pickle.dumps(session_data))
        
        with open(self.session_file, 'wb') as f:
            f.write(encrypted_data)
        
        print(f"Session gespeichert für {self.user_id} auf {self.website_id}")
    
    def load_session(self):
        """Lade Session-Cookies"""
        if not self.session_file.exists():
            return None
        
        try:
            # Lese und entschlüssele
            with open(self.session_file, 'rb') as f:
                encrypted_data = f.read()
            
            session_data = pickle.loads(self.encryption.cipher.decrypt(encrypted_data))
            
            # Prüfe Ablaufdatum (30 Tage)
            saved_at = datetime.fromisoformat(session_data['saved_at'])
            if datetime.now() - saved_at > timedelta(days=30):
                print(f"Session abgelaufen für {self.user_id} auf {self.website_id}")
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
