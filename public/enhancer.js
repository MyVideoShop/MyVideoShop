// Enhanced Streaming - Läuft auf JEDER Seite
(function() {
    'use strict';
    
    // Prüfen ob bereits geladen
    if (window.streamingEnhancerLoaded) return;
    window.streamingEnhancerLoaded = true;
    
    console.log('🎬 Streaming Enhancer aktiviert');
    
    // Control Panel erstellen
    function createControlPanel() {
        const panel = document.createElement('div');
        panel.id = 'streaming-enhancer-panel';
        panel.innerHTML = `
            <div style="
                position: fixed;
                top: 10px;
                right: 10px;
                background: rgba(0,0,0,0.95);
                color: white;
                padding: 15px;
                border-radius: 12px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                border: 2px solid #3498db;
                min-width: 200px;
                backdrop-filter: blur(10px);
                box-shadow: 0 5px 25px rgba(0,0,0,0.5);
            ">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <strong style="color: #3498db; font-size: 14px;">🎬 Enhancer</strong>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" 
                        style="background: none; border: none; color: white; cursor: pointer; font-size: 16px; padding: 0 5px;">×</button>
                </div>
                <div style="display: grid; gap: 5px;">
                    <button onclick="window.enhancerSkipIntro()" style="background: #e74c3c; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">⏭️ Intro</button>
                    <button onclick="window.enhancerNextEpisode()" style="background: #2ecc71; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;">▶️ Next</button>
                    <button onclick="window.enhancerToggleAds()" style="background: #f39c12; color: white; border: none; padding: 8px; border-radius: 6px; cursor: pointer; font-size: 12px;" id="adToggle">🚫 Ads: ON</button>
                </div>
            </div>
        `;
        document.body.appendChild(panel);
    }
    
    // Ad-Blocker Funktion
    let adBlockEnabled = true;
    function blockAds() {
        if (!adBlockEnabled) return;
        
        const adSelectors = [
            '[class*="advertisement"]',
            '[class*="ad-"]',
            '[id*="ad-"]',
            '[class*="banner"]',
            '.ad',
            '.ads',
            '.advert',
            'iframe[src*="ads"]',
            'iframe[src*="doubleclick"]'
        ];
        
        adSelectors.forEach(selector => {
            try {
                document.querySelectorAll(selector).forEach(el => {
                    if (el && el.parentNode) {
                        el.style.display = 'none';
                    }
                });
            } catch (e) {}
        });
    }
    
    // Funktionen global verfügbar machen
    window.enhancerSkipIntro = function() {
        const video = document.querySelector('video');
        if (video) {
            video.currentTime = Math.min(90, video.duration - 10);
            console.log('Intro übersprungen');
        }
    };
    
    window.enhancerNextEpisode = function() {
        // Einfache Next-Funktion
        const nextSelectors = [
            'a[href*="next"]',
            'button',
            'a',
            '[class*="next"]',
            '[class*="weiter"]'
        ];
        
        for (let selector of nextSelectors) {
            try {
                const elements = document.querySelectorAll(selector);
                for (let el of elements) {
                    const text = el.textContent.toLowerCase();
                    if (text.includes('next') || text.includes('weiter') || text.includes('continue')) {
                        el.click();
                        return;
                    }
                }
            } catch (e) {}
        }
    };
    
    window.enhancerToggleAds = function() {
        adBlockEnabled = !adBlockEnabled;
        const button = document.getElementById('adToggle');
        if (button) {
            button.textContent = adBlockEnabled ? '🚫 Ads: ON' : '🚫 Ads: OFF';
            button.style.background = adBlockEnabled ? '#f39c12' : '#95a5a6';
        }
    };
    
    // Popup-Blocker
    window.open = function() { 
        console.log('Popup blocked by Streaming Enhancer');
        return null; 
    };
    
    // Alles initialisieren
    createControlPanel();
    
    // Ad-Blocker starten (ohne Benachrichtigungen)
    blockAds();
    setInterval(blockAds, 5000); // Nur alle 5 Sekunden prüfen
    
    console.log('🎬 Streaming Enhancer bereit!');
})();
