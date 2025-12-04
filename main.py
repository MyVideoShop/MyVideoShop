import threading
import time
import schedule
from datetime import datetime
import logging
from src.bot import Bot
from src.web_interface import start_web_server
from src.auth_manager import AuthManager
from config.config import Config
from src.utils import ConfigLoader

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class BotScheduler:
    def __init__(self):
        self.running = False
        self.bot_instance = None
        
    def run_daily_tasks(self):
        """Führe tägliche Aufgaben aus"""
        logger.info(f"Starte tägliche Aufgaben um {datetime.now()}")
        
        try:
            # Lade Konfiguration
            websites = ConfigLoader.load_websites()
            
            # Für jede konfigurierte Webseite
            for website_id in websites.get('websites', {}).keys():
                logger.info(f"Verarbeite Webseite: {website_id}")
                
                # Starte Bot
                bot = Bot(website_id=website_id)
                success = bot.run()
                
                if success:
                    logger.info(f"Aufgaben für {website_id} erfolgreich")
                else:
                    logger.warning(f"Aufgaben für {website_id} fehlgeschlagen oder Login erforderlich")
                    
        except Exception as e:
            logger.error(f"Fehler bei täglichen Aufgaben: {e}")
    
    def schedule_tasks(self):
        """Plan tägliche Ausführung"""
        schedule.every().day.at(Config.RUN_TIME).do(self.run_daily_tasks)
        logger.info(f"Tägliche Ausführung geplant für {Config.RUN_TIME}")
        
        # Führe einmal beim Start aus (optional)
        # self.run_daily_tasks()
    
    def start(self):
        """Starte den Scheduler"""
        self.running = True
        self.schedule_tasks()
        
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Prüfe jede Minute
    
    def stop(self):
        """Stoppe den Scheduler"""
        self.running = False

def main():
    """Hauptanwendung"""
    logger.info("Starte Bot-System...")
    
    # Prüfe ob Session existiert
    auth = AuthManager()
    
    if auth.session_exists():
        logger.info("Session existiert. Starte automatischen Modus.")
        
        # Starte Scheduler
        scheduler = BotScheduler()
        scheduler_thread = threading.Thread(target=scheduler.start)
        scheduler_thread.daemon = True
        scheduler_thread.start()
        
        # Sofortige Ausführung (optional)
        scheduler.run_daily_tasks()
        
    else:
        logger.info("Keine Session gefunden. Manueller Login erforderlich.")
    
    # Starte Web-Server immer (für Health Checks und manuellen Login)
    start_web_server(Config.PORT)

if __name__ == "__main__":
    main()
