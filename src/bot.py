from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
import traceback
from webdriver_manager.chrome import ChromeDriverManager

from config.config import Config
from src.auth_manager import AuthManager
from src.task_engine import TaskEngine
from src.utils import ConfigLoader, TemplateRenderer

class Bot:
    def __init__(self, user_id='default', website_id='main', headless=None):
        self.user_id = user_id
        self.website_id = website_id
        self.headless = headless if headless is not None else Config.HEADLESS
        self.driver = None
        self.auth = AuthManager(user_id, website_id)
        self.wait_timeout = Config.BROWSER_TIMEOUT
        self.context = {}
        
    def setup_driver(self):
        """Setup Chrome Driver"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        # Standard-Optionen
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument(f"--window-size=1920,1080")
        chrome_options.add_argument(f"user-agent={Config.USER_AGENT}")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Für Cloud-Umgebungen
        chrome_options.add_argument('--disable-setuid-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-blink-features=AutomationControlled')
        
        try:
            # Automatische ChromeDriver-Installation
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
        except Exception as e:
            print(f"WebDriver-Manager Fehler: {e}, versuche ohne...")
            self.driver = webdriver.Chrome(options=chrome_options)
        
        # Anti-Detection
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
            "userAgent": Config.USER_AGENT
        })
        
    def load_session_cookies(self):
        """Lade gespeicherte Cookies"""
        session_data = self.auth.load_session()
        if not session_data:
            return False
        
        # Lade Webseiten-Konfiguration
        websites = ConfigLoader.load_websites()
        if self.website_id not in websites.get('websites', {}):
            print(f"Webseite '{self.website_id}' nicht in Konfiguration gefunden")
            return False
        
        base_url = websites['websites'][self.website_id]['base_url']
        self.driver.get(base_url)
        
        # Setze User-Agent
        if 'user_agent' in session_data:
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": session_data['user_agent']
            })
        
        # Füge Cookies hinzu
        for cookie in session_data['cookies']:
            try:
                self.driver.add_cookie(cookie)
            except Exception as e:
                print(f"Cookie konnte nicht hinzugefügt werden: {e}")
        
        print(f"Session-Cookies für {self.website_id} geladen")
        return True
    
    def perform_login(self):
        """Führe Login mit konfigurierten Credentials durch"""
        # Hole Anmeldedaten
        try:
            credentials = self.auth.get_credentials()
            email = credentials.get('email')
            password = credentials.get('password')
            
            if not email or not password:
                print("Keine Anmeldedaten in der Konfiguration gefunden")
                return False
        except Exception as e:
            print(f"Fehler beim Laden der Anmeldedaten: {e}")
            return False
        
        # Hole Login-URL aus Konfiguration
        websites = ConfigLoader.load_websites()
        if self.website_id not in websites.get('websites', {}):
            print(f"Webseite '{self.website_id}' nicht in Konfiguration gefunden")
            return False
        
        login_url = websites['websites'][self.website_id]['login_url']
        self.driver.get(login_url)
        
        # Warte auf Login-Formular und passe diese Selektoren an deine Webseite an
        try:
            wait = WebDriverWait(self.driver, self.wait_timeout)
            
            # ANPASSEN: Diese Selektoren müssen zu deiner Webseite passen
            # Beispiel für gängige Login-Formulare:
            
            # Versuche verschiedene Selektoren
            selectors_to_try = [
                ("email", ["input[type='email']", "input[name='email']", "#email", ".email-input"]),
                ("password", ["input[type='password']", "input[name='password']", "#password", ".password-input"]),
                ("submit", ["button[type='submit']", "input[type='submit']", "button.login", ".login-button"])
            ]
            
            # Finde die richtigen Felder
            email_field = None
            password_field = None
            submit_button = None
            
            for field_type, selectors in selectors_to_try:
                for selector in selectors:
                    try:
                        element = self.driver.find_element(By.CSS_SELECTOR, selector)
                        if field_type == "email":
                            email_field = element
                        elif field_type == "password":
                            password_field = element
                        elif field_type == "submit":
                            submit_button = element
                        break
                    except:
                        continue
            
            if not email_field or not password_field or not submit_button:
                print("Login-Formular nicht gefunden. Bitte passe die Selektoren in bot.py an.")
                return False
            
            # Fülle Login-Formular
            email_field.clear()
            email_field.send_keys(email)
            time.sleep(1)
            
            password_field.clear()
            password_field.send_keys(password)
            time.sleep(1)
            
            # Klicke Login-Button
            submit_button.click()
            time.sleep(5)
            
            # Prüfe ob Login erfolgreich
            current_url = self.driver.current_url
            if "login" in current_url or "auth" in current_url:
                print("Login möglicherweise fehlgeschlagen")
                return False
            
            print("Login erfolgreich")
            return True
            
        except Exception as e:
            print(f"Login-Fehler: {e}")
            traceback.print_exc()
            return False
    
    def execute_tasks(self):
        """Führe konfigurierte Aufgaben aus"""
        print("Starte Aufgaben-Engine...")
        
        try:
            # Hole Basis-URL für Kontext
            websites = ConfigLoader.load_websites()
            if self.website_id in websites.get('websites', {}):
                self.context['base_url'] = websites['websites'][self.website_id]['base_url']
                self.context['website_id'] = self.website_id
                self.context['user_id'] = self.user_id
            
            # Initialisiere Task-Engine
            task_engine = TaskEngine(self.driver, self.context)
            
            # Führe alle aktivierten Aufgaben aus
            success = task_engine.execute_all_enabled_tasks()
            
            return success
            
        except Exception as e:
            print(f"Fehler bei Aufgaben: {e}")
            traceback.print_exc()
            return False
    
    def run(self):
        """Hauptmethode: Führe Bot aus"""
        print(f"Starte Bot für {self.user_id} auf {self.website_id}...")
        
        try:
            self.setup_driver()
            
            # Versuche Session zu laden
            if self.load_session_cookies():
                # Teste ob Session gültig ist
                websites = ConfigLoader.load_websites()
                if self.website_id in websites.get('websites', {}):
                    dashboard_url = websites['websites'][self.website_id].get('dashboard_url', 
                        websites['websites'][self.website_id]['base_url'])
                    
                    self.driver.get(dashboard_url)
                    time.sleep(3)
                    
                    # Einfache Prüfung: Wenn Login-Seite, dann Session ungültig
                    if "login" not in self.driver.current_url.lower():
                        print("Session noch gültig, überspringe Login")
                        # Führe Aufgaben aus
                        self.execute_tasks()
                        # Speichere aktualisierte Session
                        self.auth.save_session(self.driver)
                        self.driver.quit()
                        return True
            
            # Session ungültig oder nicht vorhanden: Login erforderlich
            print("Keine gültige Session gefunden. Führe Login durch...")
            
            if self.perform_login():
                # Speichere neue Session
                self.auth.save_session(self.driver)
                
                # Führe Aufgaben aus
                self.execute_tasks()
                
                # Speichere aktualisierte Session
                self.auth.save_session(self.driver)
                
                self.driver.quit()
                return True
            else:
                print("Login fehlgeschlagen")
                if self.driver:
                    self.driver.quit()
                return False
            
        except Exception as e:
            print(f"Bot-Fehler: {e}")
            traceback.print_exc()
            if self.driver:
                self.driver.quit()
            return False
