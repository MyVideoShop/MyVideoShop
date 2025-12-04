from flask import Flask, render_template, request, jsonify, session
import threading
import time
from auth_manager import AuthManager
from bot import Bot

app = Flask(__name__)
app.config.from_object('config.Config')

# Globale Variablen für Login-Status
login_status = {'needs_login': False, 'credentials': None, 'login_complete': False}

@app.route('/')
def index():
    """Startseite - zeigt Login-Formular nur wenn nötig"""
    auth = AuthManager()
    
    if auth.session_exists():
        return render_template('login.html', needs_login=False, message="Session existiert bereits")
    else:
        login_status['needs_login'] = True
        return render_template('login.html', needs_login=True, message="Bitte einloggen")

@app.route('/login', methods=['POST'])
def handle_login():
    """Verarbeite Login-Daten"""
    username = request.form.get('username')
    password = request.form.get('password')
    
    if not username or not password:
        return jsonify({'success': False, 'message': 'Benutzername und Passwort erforderlich'})
    
    # Speichere Credentials temporär
    login_status['credentials'] = {
        'username': username,
        'password': password
    }
    
    return jsonify({
        'success': True, 
        'message': 'Login-Daten empfangen. Starte Bot...',
        'redirect': '/run-bot'
    })

@app.route('/run-bot')
def run_bot():
    """Starte den Bot mit gespeicherten Credentials"""
    if not login_status['credentials']:
        return jsonify({'success': False, 'message': 'Keine Login-Daten verfügbar'})
    
    # Starte Bot in einem separaten Thread
    def run_bot_task():
        bot = Bot()
        success = bot.run_with_credentials(
            login_status['credentials']['username'],
            login_status['credentials']['password']
        )
        
        if success:
            login_status['login_complete'] = True
            # Lösche Credentials nach erfolgreichem Login
            login_status['credentials'] = None
    
    thread = threading.Thread(target=run_bot_task)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        'success': True,
        'message': 'Bot wird gestartet...',
        'check_status': '/check-status'
    })

@app.route('/check-status')
def check_status():
    """Prüfe Bot-Status"""
    if login_status['login_complete']:
        return jsonify({
            'complete': True,
            'message': 'Login erfolgreich! Bot-Aufgaben werden ausgeführt. Diese Seite kann geschlossen werden.'
        })
    else:
        return jsonify({
            'complete': False,
            'message': 'Bot arbeitet noch...'
        })

@app.route('/health')
def health():
    """Health check für Render"""
    return jsonify({'status': 'healthy'})

def start_web_server(port=5000):
    """Starte den Flask-Server"""
    app.run(host='0.0.0.0', port=port, debug=False)
