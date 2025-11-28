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
        },
        
        createControlPanel() {
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
                    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 10px;">
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
                'iframe[src*="doubleclick"]'
            ];
            
            const removeAds = () => {
                adSelectors.forEach(selector => {
                    try {
                        document.querySelectorAll(selector).forEach(el => {
                            if (el && el.parentNode) {
                                el.style.display = 'none';
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
                }
            `;
            document.head.appendChild(style);
        },
        
        setupAutoplay() {
            if (!this.autoplayEnabled) return;
            
            const setupVideoListener = () => {
                document.querySelectorAll('video').forEach(video => {
                    if (!video.dataset.enhancedAutoplay) {
                        video.dataset.enhancedAutoplay = 'true';
                        video.addEventListener('ended', () => {
                            if (this.autoplayEnabled) {
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
            window.open = function() { return null; };
            
            // Unerwünschte Klicks blockieren
            document.addEventListener('click', (e) => {
                const link = e.target.closest('a');
                if (link && link.href) {
                    const href = link.href.toLowerCase();
                    if (href.includes('popup') || href.includes('redirect') || href.includes('ads')) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                }
            }, true);
        },
        
        setupIntroSkip() {
            if (!this.skipIntroEnabled) return;
            
            setInterval(() => {
                const video = document.querySelector('video');
                if (video && video.currentTime < 90) {
                    // Automatisch Intro überspringen nach 10 Sekunden
                    if (video.currentTime > 10 && video.currentTime < 85) {
                        video.currentTime = 90;
                    }
                }
            }, 5000);
        },
        
        toggleAutoplay(enabled) {
            this.autoplayEnabled = enabled;
            localStorage.setItem('enhancedAutoplay', enabled);
        },
        
        toggleIntroSkip(enabled) {
            this.skipIntroEnabled = enabled;
            localStorage.setItem('enhancedIntroSkip', enabled);
        },
        
        skipIntroNow() {
            const video = document.querySelector('video');
            if (video) {
                video.currentTime = Math.min(90, video.duration - 60);
            }
        },
        
        nextEpisode() {
            // Versuche nächste Folge zu finden
            const nextButtons = [
                'a[href*="next"]',
                'button:contains("Next")',
                'a:contains("Next")',
                'button:contains("Weiter")',
                'a:contains("Weiter")',
                '.next-episode',
                '.next'
            ];
            
            for (let selector of nextButtons) {
                try {
                    const element = document.querySelector(selector);
                    if (element && element.offsetParent !== null) {
                        element.click();
                        return;
                    }
                } catch (e) {}
            }
            
            alert('Nächste Folge konnte nicht automatisch gefunden werden.');
        }
    };
    
    // Einstellungen laden
    enhancedStreaming.autoplayEnabled = localStorage.getItem('enhancedAutoplay') !== 'false';
    enhancedStreaming.skipIntroEnabled = localStorage.getItem('enhancedIntroSkip') !== 'false';
    
    // Global verfügbar machen
    window.enhancedStreaming = enhancedStreaming;
    
    // Initialisieren wenn Seite geladen
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => enhancedStreaming.init());
    } else {
        enhancedStreaming.init();
    }
    
})();
