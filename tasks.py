import schedule
import time
import threading
from bot import Bot
from datetime import datetime
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class TaskScheduler:
    def __init__(self):
        self.bot = Bot()
        self.running = False
        
    def daily_task(self):
        """Tägliche Aufgabe"""
        logger.info(f"Starte tägliche Aufgabe um {datetime.now()}")
        success = self.bot.run()
        
        if success:
            logger.info("Tägliche Aufgabe erfolgreich abgeschlossen")
        else:
            logger.warning("Tägliche Aufgabe fehlgeschlagen oder benötigt manuellen Login")
            
        return success
    
    def schedule_daily_run(self, run_time="09:00"):
        """Plan tägliche Ausführung"""
        schedule.every().day.at(run_time).do(self.daily_task)
        logger.info(f"Tägliche Ausführung geplant für {run_time}")
        
        # Führe auch sofort aus beim Start (optional)
        # self.daily_task()
    
    def run_scheduler(self):
        """Starte den Scheduler"""
        self.running = True
        while self.running:
            schedule.run_pending()
            time.sleep(60)  # Prüfe jede Minute
    
    def stop(self):
        """Stoppe den Scheduler"""
        self.running = False
