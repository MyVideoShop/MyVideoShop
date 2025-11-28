const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Erweiterte Proxy-Funktion mit Content-Modification
app.get('/proxy/*', async (req, res) => {
  try {
    const targetUrl = req.params[0];
    if (!targetUrl) {
      return res.status(400).send('URL parameter required');
    }
    
    // URL dekodieren
    const decodedUrl = decodeURIComponent(targetUrl);
    
    // Fetch der Zielseite
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    let html = await response.text();
    
    // Content-Modification für jede Seite
    html = enhancePage(html, decodedUrl);
    
    // Content-Type setzen
    res.set('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).send('Proxy Fehler');
  }
});

// Funktion zur Verbesserung der Seiten
function enhancePage(html, url) {
  // Basis-Skript für alle Erweiterungen injizieren
  const enhancementScript = `
    <script>
      // Enhanced Streaming Functions
      window.enhancedStreaming = {
        autoplayEnabled: localStorage.getItem('autoplay') === 'true',
        skipIntroEnabled: localStorage.getItem('skipIntro') === 'true',
        adBlockEnabled: true,
        
        init() {
          this.injectControls();
          this.blockAds();
          this.setupAutoplay();
          this.setupIntroSkip();
          this.preventRedirects();
        },
        
        injectControls() {
          // Steuerleiste hinzufügen
          const controls = document.createElement('div');
          controls.id = 'enhanced-controls';
          controls.innerHTML = \`
            <div style="
              position: fixed;
              top: 10px;
              right: 10px;
              background: rgba(0,0,0,0.8);
              color: white;
              padding: 10px;
              border-radius: 5px;
              z-index: 10000;
              font-family: Arial, sans-serif;
              font-size: 12px;
            ">
              <strong>Enhanced Streaming</strong>
              <div>
                <label>
                  <input type="checkbox" id="autoplayToggle" \${this.autoplayEnabled ? 'checked' : ''}>
                  Autoplay
                </label>
                <label>
                  <input type="checkbox" id="skipIntroToggle" \${this.skipIntroEnabled ? 'checked' : ''}>
                  Intro Skip
                </label>
                <button onclick="window.enhancedStreaming.skipIntroNow()">Intro jetzt überspringen</button>
                <button onclick="window.enhancedStreaming.nextEpisode()">Nächste Folge</button>
              </div>
            </div>
          \`;
          document.body.appendChild(controls);
          
          // Event Listener für Toggles
          document.getElementById('autoplayToggle').addEventListener('change', (e) => {
            this.autoplayEnabled = e.target.checked;
            localStorage.setItem('autoplay', e.target.checked);
          });
          
          document.getElementById('skipIntroToggle').addEventListener('change', (e) => {
            this.skipIntroEnabled = e.target.checked;
            localStorage.setItem('skipIntro', e.target.checked);
          });
        },
        
        blockAds() {
          // Werbung blockieren
          const adSelectors = [
            '[class*="advertisement"]',
            '[class*="ad-"]',
            '[id*="ad-"]',
            '.ad',
            '.ads',
            '.advert',
            iframe[src*="ads"],
            iframe[src*="doubleclick"]
          ];
          
          setInterval(() => {
            adSelectors.forEach(selector => {
              document.querySelectorAll(selector).forEach(el => {
                if (el && el.parentNode) {
                  el.parentNode.removeChild(el);
                }
              });
            });
          }, 1000);
        },
        
        setupAutoplay() {
          if (!this.autoplayEnabled) return;
          
          // Autoplay für verschiedene Video-Player
          const videoPlayers = document.querySelectorAll('video, iframe');
          videoPlayers.forEach(player => {
            if (player.tagName === 'VIDEO') {
              player.addEventListener('ended', () => {
                this.nextEpisode();
              });
            }
          });
        },
        
        setupIntroSkip() {
          if (!this.skipIntroIntroEnabled) return;
          
          // Intro-Skip Logik
          setInterval(() => {
            const video = document.querySelector('video');
            if (video && video.currentTime < 90) { // Erste 90 Sekunden
              // Prüfen ob Intro-Text auf dem Bildschirm ist
              const pageText = document.body.innerText.toLowerCase();
              const introIndicators = ['intro', 'vorspann', 'opening', 'theme'];
              
              if (introIndicators.some(indicator => pageText.includes(indicator))) {
                this.skipIntroNow();
              }
            }
          }, 5000);
        },
        
        skipIntroNow() {
          const video = document.querySelector('video');
          if (video) {
            video.currentTime = 90; // Zur 90. Sekunde springen
          }
        },
        
        nextEpisode() {
          // Nächste Folge Logik
          const nextButtons = [
            'a[href*="next"]',
            'button:contains("Next")',
            '.next-episode',
            '.next'
          ];
          
          nextButtons.forEach(selector => {
            const element = document.querySelector(selector);
            if (element) {
              element.click();
              return;
            }
          });
        },
        
        preventRedirects() {
          // Unerwünschte Weiterleitungen verhindern
          window.onbeforeunload = null;
          
          // Link-Clicks überwachen
          document.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href) {
              const href = link.href.toLowerCase();
              const blockedPatterns = [
                'popup',
                'redirect',
                'exit',
                'ads',
                'banner'
              ];
              
              if (blockedPatterns.some(pattern => href.includes(pattern))) {
                e.preventDefault();
                console.log('Blocked redirect:', href);
              }
            }
          });
        }
      };
      
      // Initialisierung wenn Seite geladen
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
          window.enhancedStreaming.init();
        });
      } else {
        window.enhancedStreaming.init();
      }
    </script>
    <style>
      /* Werbung ausblenden */
      [class*="advertisement"], [class*="ad-"], [id*="ad-"], .ad, .ads, .advert {
        display: none !important;
      }
      
      /* Enhanced Controls Styling */
      #enhanced-controls label {
        display: block;
        margin: 5px 0;
        cursor: pointer;
      }
      
      #enhanced-controls button {
        background: #3498db;
        color: white;
        border: none;
        padding: 5px 10px;
        margin: 2px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 11px;
      }
      
      #enhanced-controls button:hover {
        background: #2980b9;
      }
    </style>
  `;
  
  // Skript vor dem schließenden </body> Tag einfügen
  if (html.includes('</body>')) {
    html = html.replace('</body>', enhancementScript + '</body>');
  } else {
    html += enhancementScript;
  }
  
  return html;
}

// Start Server
app.listen(PORT, () => {
  console.log(`Enhanced Streaming Hub läuft auf Port ${PORT}`);
});
