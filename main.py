import threading
import time
from web_interface import start_web_server
from tasks import TaskScheduler
from auth_manager import AuthManager
from config import Config
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
