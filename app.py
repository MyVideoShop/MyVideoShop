from flask import Flask, render_template, send_file, jsonify
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/userscript')
def userscript():
    return send_file('aniworld-assistant.user.js', 
                    as_attachment=True, 
                    download_name='aniworld-assistant.user.js')

@app.route('/install')
def install_guide():
    return render_template('install.html')

@app.route('/api/settings')
def get_settings():
    return jsonify({
        'version': '1.0',
        'features': ['autoplay', 'introskip', 'adblock', 'recapskip']
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
