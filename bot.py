from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException
import time
from auth_manager import AuthManager
from config import Config
import traceback

class Bot:
    def __init__(self, headless=None):
        self.headless = headless if headless is not None else Config.HEADLESS
        self.driver = None
        self.auth = AuthManager()
        self.wait_timeout = Config.BROWSER_TIMEOUT
        
    def setup_driver(self):
        """Setup Chrome Driver mit Optionen"""
        chrome_options = Options()
        
        if self.headless:
            chrome_options.add_argument("--headless=new")
        
        chrome_options.add_argument("--no-sandbox")
        chrome_options.add_argument("--disable-dev-shm-usage")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument("--disable-blink-features=AutomationControlled")
        chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
        chrome_options.add_experimental_option('useAutomationExtension', False)
        
        # Für Render/Cloud-Umgebungen
        chrome_options.add_argument('--disable-setuid-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        
        # Automatische ChromeDriver-Version
        try:
            from selenium.webdriver.chrome.service import Service as ChromeService
            from webdriver_manager.chrome import ChromeDriverManager
            service = ChromeService(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=chrome_options)
        except:
            # Fallback: Ohne webdriver_manager
            self.driver = webdriver.Chrome(options=chrome_options)
        
        self.driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
    def load_session_cookies(self):
        """Lade gespeicherte Cookies in den Browser"""
        session_data = self.auth.load_session()
        if not session_data:
            return False
        
        self.driver.get(Config.BASE_URL)
        
        # Setze User-Agent
        if 'user_agent' in session_data:
            self.driver.execute_cdp_cmd('Network.setUserAgentOverride', {
                "userAgent": session_data['user_agent']
            })
        
        # Füge Cookies hinzu
        for cookie in session_data['cookies']:
            try:
                self.driver.add_cookie(cookie)
            except:
                pass
        
        print("Session-Cookies geladen")
        return True
    
    def perform_login(self, username=None, password=None):
        """Führe Login durch"""
        self.driver.get(Config.LOGIN_URL)
        
        # Warte auf Login-Formular (Passe diese Selektoren an deine Website an)
        try:
            wait = WebDriverWait(self.driver, self.wait_timeout)
            
            # Beispiel-Selektoren - ANPASSEN!
            username_field = wait.until(
                EC.presence_of_element_located((By.NAME, "username"))
            )
            password_field = self.driver.find_element(By.NAME, "password")
            login_button = self.driver.find_element(By.XPATH, "//button[@type='submit']")
            
            # Fülle Login-Formular
            username_field.send_keys(username)
            password_field.send_keys(password)
            login_button.click()
            
            # Warte auf Login-Erfolg
            time.sleep(5)
            
            # Prüfe ob Login erfolgreich war
            # Passe diese Prüfung an deine Website an
            if "dashboard" in self.driver.current_url or "home" in self.driver.current_url:
                print("Login erfolgreich")
                return True
            else:
                print("Login möglicherweise fehlgeschlagen")
                return False
                
        except Exception as e:
            print(f"Login-Fehler: {e}")
            return False
    
    def execute_tasks(self):
        """Führe die eigentlichen Bot-Aufgaben durch"""
        print("Starte Aufgaben...")
        
        try:
            # Beispiel-Aufgabe 1: Navigiere zu einer Seite
            self.driver.get(f"{Config.BASE_URL}/dashboard")
            time.sleep(3)
            
            # Beispiel-Aufgabe 2: Klicke einen Button
            # Passe diese Aufgaben an deine Website an
            try:
                task_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(text(),'Daily Reward')]"))
                )
                task_button.click()
                print("Tägliche Belohnung abgeholt")
                time.sleep(2)
            except:
                print("Tägliche Belohnung nicht verfügbar")
            
            # Beispiel-Aufgabe 3: Fülle ein Formular aus
            # Füge hier deine spezifischen Aufgaben hinzu
            
            print("Alle Aufgaben abgeschlossen")
            return True
            
        except Exception as e:
            print(f"Fehler bei Aufgaben: {e}")
            traceback.print_exc()
            return False
    
    def run(self):
        """Hauptmethode: Führe den Bot aus"""
        print("Starte Bot...")
        
        try:
            self.setup_driver()
            
            # Versuche Session zu laden
            if self.load_session_cookies():
                # Teste ob Session noch gültig ist
                self.driver.get(f"{Config.BASE_URL}/dashboard")
                time.sleep(3)
                
                # Prüfe ob wir eingeloggt sind (passe diesen Check an)
                if "login" not in self.driver.current_url:
                    print("Session noch gültig, überspringe Login")
                    # Führe Aufgaben aus
                    self.execute_tasks()
                    # Speichere aktualisierte Cookies
                    self.auth.save_session(self.driver)
                    self.driver.quit()
                    return True
            
            # Wenn keine gültige Session: Starte Web-Interface
            print("Keine gültige Session gefunden. Bitte manuell einloggen.")
            from web_interface import login_status
            login_status['needs_login'] = True
            
            # Hier würde normalerweise das Web-Interface gestartet werden
            # In der automatischen Ausführung kehren wir hier zurück
            return False
            
        except Exception as e:
            print(f"Bot-Fehler: {e}")
            traceback.print_exc()
            if self.driver:
                self.driver.quit()
            return False
    
    def run_with_credentials(self, username, password):
        """Führe Bot mit gegebenen Credentials aus"""
        try:
            self.setup_driver()
            
            # Versuche Login
            if self.perform_login(username, password):
                # Speichere Session
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
            print(f"Fehler: {e}")
            if self.driver:
                self.driver.quit()
            return False
