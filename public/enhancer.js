// Enhanced Streaming Features - Lädt direkt auf der Seite
(function() {
    'use strict';
    
    // Prüfen ob bereits geladen
    if (window.enhancedStreamingLoaded) return;
    window.enhancedStreamingLoaded = true;
    
    console.log('🎬 Enhanced Streaming aktiviert');
    
    const enhancedStreaming = {
        autoplayEnabled: true,
        skipIntroEnabled: true,
        adBlockEnabled: true,
        
        init() {
            this.createControlPanel();
            this.setupAdBlock();
            this.setupAutoplay();
            this.setupRedirectProtection();
            this.setupIntroSkip();
            this.showSuccessMessage();
        },
        
        createControlPanel() {
            // Altes Panel entfernen falls vorhanden
            const oldPanel = document.getElementById('enhanced-streaming-panel');
            if (oldPanel) oldPanel.remove();
            
            // Control Panel erstellen
            const panel = document.createElement('div');
            panel.id = 'enhanced-streaming-panel';
            panel.innerHTML = `
                <div style="
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: rgba(0,0,0,0.95);
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    z-index: 10000;
                    font-family: Arial, sans-serif;
                    font-size: 14px;
                    border: 2px solid #3498db;
                    min-width: 250px;
                    backdrop-filter: blur(10px);
                    box-shadow: 0 5px 25px rgba(0,0,0,0.5);
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <strong style="color: #3498db; font-size: 16px;">🎬 Enhanced Streaming</strong>
                        <button onclick="this.parentElement.parentElement.parentElement.style.display='none'" 
                            style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 10px;">×</button>
                    </div>
                    <div style="display: grid; gap: 8px;">
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" ${this.autoplayEnabled ? 'checked' : ''} onchange="window.enhancedStreaming.toggleAutoplay(this.checked)">
                            <span>Autoplay nächste Folge</span>
                        </label>
                        <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                            <input type="checkbox" ${this.skipIntroEnabled ? 'checked' : ''} onchange="window.enhancedStreaming.toggleIntroSkip(this.checked)">
                            <span>Intro automatisch überspringen</span>
                        </label>
                        <div style="display: flex; gap: 5px; margin-top: 5px;">
                            <button onclick="window.enhancedStreaming.skipIntroNow()" 
                                style="flex: 1; background: #e74c3c; border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                ⏭️ Intro skip
                            </button>
                            <button onclick="window.enhancedStreaming.nextEpisode()" 
                                style="flex: 1; background: #2ecc71; border: none; color: white; padding: 8px; border-radius: 5px; cursor: pointer; font-size: 12px;">
                                ▶️ Nächste Folge
                            </button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(panel);
        },
        
        setupAdBlock() {
            // Werbung blockieren
            const adSelectors = [
                '[class*="advertisement"]',
                '[class*="ad-"]',
                '[id*="ad-"]',
                '[class*="banner"]',
                '.ad',
                '.ads',
                '.advert',
                'iframe[src*="ads"]',
                'iframe[src*="doubleclick"]',
                '[class*="popup"]',
                '[id*="popup"]'
            ];
            
            const removeAds = () => {
                adSelectors.forEach(selector => {
                    try {
                        document.querySelectorAll(selector).forEach(el => {
                            if (el && el.parentNode) {
                                el.style.display = 'none';
                                el.style.visibility = 'hidden';
                            }
                        });
                    } catch (e) {}
                });
            };
            
            removeAds();
            setInterval(removeAds, 2000);
            
            // CSS für Werbeblocker
            const style = document.createElement('style');
            style.textContent = `
                ${adSelectors.join(', ')} {
                    display: none !important;
                    visibility: hidden !important;
                    height: 0 !important;
                    width: 0 !important;
                    opacity: 0 !important;
                    position: absolute !important;
                }
            `;
            document.head.appendChild(style);
        },
        
        setupAutoplay() {
            const setupVideoListener = () => {
                document.querySelectorAll('video').forEach(video => {
                    if (!video.dataset.enhancedAutoplay) {
                        video.dataset.enhancedAutoplay = 'true';
                        video.addEventListener('ended', () => {
                            if (this.autoplayEnabled) {
                                console.log('Video ended - trying next episode...');
                                setTimeout(() => this.nextEpisode(), 3000);
                            }
                        });
                    }
                });
            };
            
            setupVideoListener();
            setInterval(setupVideoListener, 3000);
        },
        
        setupRedirectProtection() {
            // Popups blockieren
            const originalOpen = window.open;
            window.open = function() { 
                console.log('Popup blocked by Enhanced Streaming');
                return null; 
            };
            
            // Unerwünschte Klicks blockieren
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.href) {
                    const href = link.href.toLowerCase();
                    if (href.includes('popup') || href.includes('redirect') || href.includes('ads') || href.includes('banner')) {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log('Blocked suspicious link:', href);
                    }
                }
            }, true);
        },
        
        setupIntroSkip() {
            setInterval(() => {
                if (!this.skipIntroEnabled) return;
                
                const video = document.querySelector('video');
                if (video && video.currentTime < 90 && video.currentTime > 10) {
                    // Automatisch Intro überspringen
                    video.currentTime = 90;
                    console.log('Intro automatically skipped');
                }
            }, 5000);
        },
        
        toggleAutoplay(enabled) {
            this.autoplayEnabled = enabled;
            localStorage.setItem('enhancedAutoplay', enabled);
            console.log('Autoplay:', enabled ? 'ON' : 'OFF');
        },
        
        toggleIntroSkip(enabled) {
            this.skipIntroEnabled = enabled;
            localStorage.setItem('enhancedIntroSkip', enabled);
            console.log('Intro Skip:', enabled ? 'ON' : 'OFF');
        },
        
        skipIntroNow() {
            const video = document.querySelector('video');
            if (video) {
                video.currentTime = Math.min(90, video.duration - 60);
                console.log('Intro skipped manually');
            }
        },
        
        nextEpisode() {
            // Versuche nächste Folge zu finden
            const nextSelectors = [
                'a[href*="next"]',
                'button',
                'a',
                '[class*="next"]',
                '[class*="weiter"]',
                '[class*="continue"]'
            ];
            
            for (let selector of nextSelectors) {
                try {
                    const elements = document.querySelectorAll(selector);
                    for (let el of elements) {
                        const text = el.textContent.toLowerCase();
                        if ((text.includes('next') || text.includes('weiter') || text.includes('continue')) && 
                            el.offsetParent !== null) {
                            console.log('Found next button:', el);
                            el.click();
                            return true;
                        }
                    }
                } catch (e) {}
            }
            
            console.log('No next episode button found');
            return false;
        },
        
        showSuccessMessage() {
            // Erfolgsmeldung anzeigen
            const message = document.createElement('div');
            message.innerHTML = `
                <div style="
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(46, 204, 113, 0.95);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    z-index: 10001;
                    font-family: Arial, sans-serif;
                    text-align: center;
                    border: 2px solid #27ae60;
                    box-shadow: 0 5px 25px rgba(0,0,0,0.5);
                ">
                    <h3>🎉 Enhanced Streaming aktiviert!</h3>
                    <p>Werbeblocker, Autoplay und Intro-Skip sind jetzt aktiv.</p>
                    <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #27ae60; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer; margin-top: 10px;">
                        OK
                    </button>
                </div>
            `;
            document.body.appendChild(message);
            
            // Nach 5 Sekunden automatisch entfernen
            setTimeout(() => {
                if (message.parentElement) {
                    message.remove();
                }
            }, 5000);
        }
    };
    
    // Einstellungen laden
    enhancedStreaming.autoplayEnabled = localStorage.getItem('enhancedAutoplay') !== 'false';
    enhancedStreaming.skipIntroEnabled = localStorage.getItem('enhancedIntroSkip') !== 'false';
    
    // Global verfügbar machen
    window.enhancedStreaming = enhancedStreaming;
    
    // Initialisieren
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => enhancedStreaming.init());
    } else {
        enhancedStreaming.init();
    }
    
})();
