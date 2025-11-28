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

// Proxy-Funktion die das Design erhält
app.get('/proxy/*', async (req, res) => {
  try {
    const targetUrl = req.params[0];
    if (!targetUrl) {
      return res.status(400).send('URL parameter required');
    }
    
    // URL dekodieren
    const decodedUrl = decodeURIComponent(targetUrl);
    console.log('Fetching:', decodedUrl);
    
    // Fetch der Zielseite
    const response = await fetch(decodedUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8'
      }
    });
    
    let html = await response.text();
    
    // Nur notwendige Erweiterungen hinzufügen
    html = addEnhancements(html, decodedUrl);
    
    // Content-Type setzen
    res.set('Content-Type', 'text/html');
    res.send(html);
    
  } catch (error) {
    console.error('Proxy Error:', error);
    res.status(500).send(`
      <html>
        <body>
          <h1>Fehler beim Laden der Seite</h1>
          <p>${error.message}</p>
          <a href="/">Zurück zum Hub</a>
        </body>
      </html>
    `);
  }
});

// Funktion für minimale Erweiterungen
function addEnhancements(html, url) {
  // Nur unser Enhancement-Skript hinzufügen, ohne Design zu verändern
  const enhancementScript = `
    <script>
      // Enhanced Streaming Functions - Minimal Invasive
      (function() {
        console.log('Enhanced Streaming aktiviert');
        
        const enhancedStreaming = {
          autoplayEnabled: localStorage.getItem('autoplay') === 'true',
          skipIntroEnabled: localStorage.getItem('skipIntro') === 'true',
          
          init() {
            this.injectControls();
            this.setupAdBlock();
            this.setupAutoplay();
            this.setupRedirectProtection();
            this.fixBrokenLinks();
          },
          
          injectControls() {
            // Kleine, unauffällige Steuerleiste
            if (document.getElementById('enhanced-controls')) return;
            
            const controls = document.createElement('div');
            controls.id = 'enhanced-controls';
            controls.innerHTML = \`
              <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.9);
                color: white;
                padding: 12px;
                border-radius: 8px;
                z-index: 10000;
                font-family: Arial, sans-serif;
                font-size: 12px;
                border: 2px solid #3498db;
                min-width: 200px;
                backdrop-filter: blur(10px);
              ">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                  <strong style="color: #3498db;">🎬 Enhanced</strong>
                  <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" 
                    style="background: none; border: none; color: white; cursor: pointer; font-size: 16px;">×</button>
                </div>
                <div style="display: flex; flex-direction: column; gap: 6px;">
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="autoplayToggle" \${this.autoplayEnabled ? 'checked' : ''}>
                    <span>Autoplay</span>
                  </label>
                  <label style="display: flex; align-items: center; gap: 6px; cursor: pointer;">
                    <input type="checkbox" id="skipIntroToggle" \${this.skipIntroEnabled ? 'checked' : ''}>
                    <span>Intro Skip</span>
                  </label>
                  <div style="display: flex; gap: 4px; margin-top: 4px;">
                    <button onclick="window.enhancedStreaming.skipIntroNow()" 
                      style="flex: 1; background: #e74c3c; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                      Intro skip
                    </button>
                    <button onclick="window.enhancedStreaming.nextEpisode()" 
                      style="flex: 1; background: #2ecc71; border: none; color: white; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 11px;">
                      Nächste Folge
                    </button>
                  </div>
                </div>
              </div>
            \`;
            document.body.appendChild(controls);
            
            // Event Listener
            document.getElementById('autoplayToggle').addEventListener('change', (e) => {
              this.autoplayEnabled = e.target.checked;
              localStorage.setItem('autoplay', e.target.checked);
            });
            
            document.getElementById('skipIntroToggle').addEventListener('change', (e) => {
              this.skipIntroEnabled = e.target.checked;
              localStorage.setItem('skipIntro', e.target.checked);
            });
          },
          
          setupAdBlock() {
            // Selektoren für gängige Werbung
            const adSelectors = [
              '[class*="advertisement"]',
              '[class*="ad-"]',
              '[id*="ad-"]',
              '[class*="banner"]',
              '[id*="banner"]',
              '.ad',
              '.ads',
              '.advert',
              'iframe[src*="ads"]',
              'iframe[src*="doubleclick"]',
              'iframe[src*="googleadservices"]'
            ];
            
            // Werbung entfernen
            const removeAds = () => {
              adSelectors.forEach(selector => {
                try {
                  document.querySelectorAll(selector).forEach(el => {
                    if (el && el.parentNode) {
                      el.parentNode.removeChild(el);
                    }
                  });
                } catch (e) {
                  // Ignoriere Fehler bei bestimmten Selektoren
                }
              });
            };
            
            // Initial und dann regelmäßig
            removeAds();
            setInterval(removeAds, 2000);
          },
          
          setupAutoplay() {
            if (!this.autoplayEnabled) return;
            
            // Video-Player finden und Autoplay einrichten
            const setupVideoAutoplay = () => {
              const videos = document.querySelectorAll('video');
              videos.forEach(video => {
                if (!video.hasAttribute('data-enhanced-autoplay')) {
                  video.setAttribute('data-enhanced-autoplay', 'true');
                  video.addEventListener('ended', () => {
                    if (this.autoplayEnabled) {
                      setTimeout(() => this.nextEpisode(), 2000);
                    }
                  });
                }
              });
            };
            
            setupVideoAutoplay();
            setInterval(setupVideoAutoplay, 3000);
          },
          
          setupRedirectProtection() {
            // Popup-Blocker
            window.originalOpen = window.open;
            window.open = function(url, name, features) {
              console.log('Blocked popup:', url);
              return null;
            };
            
            // Unerwünschte Weiterleitungen blockieren
            document.addEventListener('click', (e) => {
              const link = e.target.closest('a');
              if (link && link.href) {
                const href = link.href.toLowerCase();
                const blockedPatterns = [
                  'popup',
                  'redirect',
                  'exit',
                  'ads',
                  'banner',
                  'click'
                ];
                
                if (blockedPatterns.some(pattern => href.includes(pattern))) {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Blocked redirect:', href);
                  return false;
                }
              }
            }, true);
          },
          
          fixBrokenLinks() {
            // Relative Links in absolute URLs umwandeln
            document.querySelectorAll('a[href^="/"]').forEach(link => {
              const currentOrigin = new URL('${url}').origin;
              if (link.href.startsWith('/')) {
                link.href = currentOrigin + link.href;
              }
            });
          },
          
          skipIntroNow() {
            const videos = document.querySelectorAll('video');
            videos.forEach(video => {
              if (video.duration > 60) { // Nur bei längeren Videos
                video.currentTime = Math.min(90, video.duration - 10);
              }
            });
          },
          
          nextEpisode() {
            // Versuche nächste Folge zu finden
            const nextSelectors = [
              'a[href*="next"]',
              'button:contains("Next")',
              'a:contains("Next")',
              'button:contains("Weiter")',
              'a:contains("Weiter")',
              '.next-episode',
              '.next',
              '[class*="next"]'
            ];
            
            for (let selector of nextSelectors) {
              try {
                const elements = document.querySelectorAll(selector);
                for (let el of elements) {
                  if (el.offsetParent !== null) { // Sichtbares Element
                    el.click();
                    return true;
                  }
                }
              } catch (e) {
                // Selector könnte ungültig sein
              }
            }
            
            // Fallback: URL manipulieren für Serien
            if (window.location.href.includes('/season/') || window.location.href.includes('/episode/')) {
              const match = window.location.href.match(/(\\/episode\\/\\d+)/);
              if (match) {
                const currentEp = parseInt(match[1].replace('/episode/', ''));
                const nextUrl = window.location.href.replace(
                  \`/episode/\${currentEp}\`, 
                  \`/episode/\${currentEp + 1}\`
                );
                window.location.href = nextUrl;
                return true;
              }
            }
            
            return false;
          }
        };
        
        // Globale Verfügbarkeit
        window.enhancedStreaming = enhancedStreaming;
        
        // Initialisierung
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => {
            enhancedStreaming.init();
          });
        } else {
          enhancedStreaming.init();
        }
        
        // CSS für Werbeausblendung
        const style = document.createElement('style');
        style.textContent = \`
          [class*="advertisement"], 
          [class*="ad-"], 
          [id*="ad-"], 
          [class*="banner"],
          .ad, 
          .ads, 
          .advert {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
          }
        \`;
        document.head.appendChild(style);
        
      })();
    </script>
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
