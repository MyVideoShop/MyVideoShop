// ==UserScript==
// @name         AniWorld Assistant
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  AutoPlay, IntroSkip und AdBlock für AniWorld
// @author       You
// @match        https://aniworld.to/*
// @match        https://*.aniworld.to/*
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @require      https://code.jquery.com/jquery-3.6.0.min.js
// ==/UserScript==

(function() {
    'use strict';
    
    class AniWorldAssistant {
        constructor() {
            this.settings = {
                autoPlay: true,
                skipIntro: true,
                blockAds: true,
                skipRecap: true
            };
            this.init();
        }

        async init() {
            await this.loadSettings();
            this.createControlPanel();
            this.setupObservers();
            this.applyFeatures();
        }

        async loadSettings() {
            const saved = await GM_getValue('aniworldSettings');
            this.settings = { ...this.settings, ...saved };
        }

        saveSettings() {
            GM_setValue('aniworldSettings', this.settings);
        }

        createControlPanel() {
            const panel = document.createElement('div');
            panel.id = 'aniworld-assistant-panel';
            panel.innerHTML = `
                <div class="assistant-header">
                    <h4>AniWorld Assistant</h4>
                    <button class="close-btn">×</button>
                </div>
                <div class="assistant-controls">
                    <label>
                        <input type="checkbox" id="assistant-autoplay" ${this.settings.autoPlay ? 'checked' : ''}> AutoPlay
                    </label>
                    <label>
                        <input type="checkbox" id="assistant-skipintro" ${this.settings.skipIntro ? 'checked' : ''}> Intro Skip
                    </label>
                    <label>
                        <input type="checkbox" id="assistant-blockads" ${this.settings.blockAds ? 'checked' : ''}> AdBlock
                    </label>
                    <label>
                        <input type="checkbox" id="assistant-skiprecap" ${this.settings.skipRecap ? 'checked' : ''}> Recap Skip
                    </label>
                    <button id="assistant-save">Speichern</button>
                </div>
            `;

            document.body.appendChild(panel);
            this.addPanelStyles();
            this.setupPanelEvents();
        }

        addPanelStyles() {
            GM_addStyle(`
                #aniworld-assistant-panel {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: #2c3e50;
                    color: white;
                    padding: 15px;
                    border-radius: 10px;
                    z-index: 10000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    min-width: 250px;
                    font-family: Arial, sans-serif;
                }
                .assistant-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                    border-bottom: 1px solid #34495e;
                    padding-bottom: 10px;
                }
                .assistant-header h4 {
                    margin: 0;
                    font-size: 14px;
                }
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    cursor: pointer;
                    font-size: 18px;
                }
                .assistant-controls label {
                    display: block;
                    margin: 8px 0;
                    font-size: 12px;
                    cursor: pointer;
                }
                .assistant-controls input {
                    margin-right: 8px;
                }
                #assistant-save {
                    width: 100%;
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 8px;
                    border-radius: 5px;
                    cursor: pointer;
                    margin-top: 10px;
                }
                #assistant-save:hover {
                    background: #2980b9;
                }
                .skip-button {
                    position: fixed;
                    bottom: 100px;
                    right: 20px;
                    z-index: 9999;
                    background: #e74c3c;
                    color: white;
                    border: none;
                    padding: 12px 18px;
                    border-radius: 25px;
                    cursor: pointer;
                    font-weight: bold;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    transition: all 0.3s ease;
                }
                .skip-button:hover {
                    background: #c0392b;
                    transform: scale(1.05);
                }
            `);
        }

        setupPanelEvents() {
            document.getElementById('assistant-save').addEventListener('click', () => {
                this.settings.autoPlay = document.getElementById('assistant-autoplay').checked;
                this.settings.skipIntro = document.getElementById('assistant-skipintro').checked;
                this.settings.blockAds = document.getElementById('assistant-blockads').checked;
                this.settings.skipRecap = document.getElementById('assistant-skiprecap').checked;
                
                this.saveSettings();
                this.applyFeatures();
                
                // Feedback
                const saveBtn = document.getElementById('assistant-save');
                saveBtn.textContent = 'Gespeichert!';
                setTimeout(() => {
                    saveBtn.textContent = 'Speichern';
                }, 2000);
            });

            document.querySelector('.close-btn').addEventListener('click', () => {
                document.getElementById('aniworld-assistant-panel').style.display = 'none';
            });
        }

        setupObservers() {
            // Observer für Video-Player
            const observer = new MutationObserver((mutations) => {
                let shouldApply = false;
                
                mutations.forEach((mutation) => {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) {
                            if (node.querySelector && (
                                node.querySelector('video') || 
                                node.querySelector('.player') ||
                                node.querySelector('[class*="video"]')
                            )) {
                                shouldApply = true;
                            }
                        }
                    });
                });
                
                if (shouldApply) {
                    setTimeout(() => this.applyFeatures(), 500);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            // Periodische Überprüfung für Single-Page Applications
            setInterval(() => {
                if (document.querySelector('video') && !this.videoInitialized) {
                    this.applyFeatures();
                }
            }, 2000);
        }

        applyFeatures() {
            if (this.settings.blockAds) {
                this.blockAdsAndPopups();
            }
            
            this.setupVideoControls();
        }

        setupVideoControls() {
            const video = document.querySelector('video');
            if (!video) return;

            this.videoInitialized = true;

            // AutoPlay
            if (this.settings.autoPlay) {
                video.addEventListener('ended', this.handleVideoEnd.bind(this));
                
                // Stelle sicher, dass Autoplay funktioniert
                video.play().catch(e => console.log('Autoplay prevented:', e));
            }

            // Intro Skip
            if (this.settings.skipIntro) {
                this.setupIntroSkip(video);
            }

            // Recap Skip
            if (this.settings.skipRecap) {
                this.setupRecapSkip(video);
            }
        }

        setupIntroSkip(video) {
            // Entferne vorhandene Skip-Buttons
            const existingBtn = document.querySelector('.skip-intro-button');
            if (existingBtn) existingBtn.remove();

            const skipBtn = document.createElement('button');
            skipBtn.className = 'skip-button skip-intro-button';
            skipBtn.innerHTML = '⏭️ Intro überspringen';
            skipBtn.style.display = 'none';

            skipBtn.addEventListener('click', () => {
                video.currentTime = 90; // Springe zu 1:30 (Ende des Intros)
                skipBtn.style.display = 'none';
            });

            document.body.appendChild(skipBtn);

            video.addEventListener('timeupdate', () => {
                if (!this.settings.skipIntro) return;

                const currentTime = video.currentTime;
                
                // Zeige Skip-Button zwischen 1:20 und 1:40
                if (currentTime >= 80 && currentTime <= 100) {
                    skipBtn.style.display = 'block';
                } else {
                    skipBtn.style.display = 'none';
                }

                // Auto-Skip bei ~1:25
                if (currentTime >= 85 && currentTime < 86) {
                    video.currentTime = 90;
                }
            });
        }

        setupRecapSkip(video) {
            video.addEventListener('timeupdate', () => {
                if (!this.settings.skipRecap) return;

                const currentTime = video.currentTime;
                
                // Überspringe Recap in den ersten 2 Minuten
                if (currentTime >= 60 && currentTime <= 120) {
                    const text = document.body.textContent.toLowerCase();
                    if (text.includes('recap') || text.includes('zusammenfassung')) {
                        video.currentTime = 120; // Springe zu 2:00
                    }
                }
            });
        }

        handleVideoEnd() {
            if (!this.settings.autoPlay) return;

            setTimeout(() => {
                this.playNextEpisode();
            }, 3000); // 3 Sekunden Verzögerung
        }

        playNextEpisode() {
            // Versuche verschiedene Next-Button Selektoren
            const nextSelectors = [
                '[data-next-episode]',
                '.next-episode',
                '.play-next',
                '.next',
                '[class*="next"]',
                'a[href*="episode"]'
            ];

            for (const selector of nextSelectors) {
                const elements = document.querySelectorAll(selector);
                for (const el of elements) {
                    const text = el.textContent.toLowerCase();
                    if (text.includes('next') || text.includes('weiter') || text.includes('nächste')) {
                        el.click();
                        return;
                    }
                }
            }

            // Fallback: URL-basiert
            this.playNextEpisodeByUrl();
        }

        playNextEpisodeByUrl() {
            const currentUrl = window.location.href;
            const episodeMatch = currentUrl.match(/episode-(\d+)/i);
            
            if (episodeMatch) {
                const currentEp = parseInt(episodeMatch[1]);
                const nextEp = currentEp + 1;
                const nextUrl = currentUrl.replace(/episode-\d+/i, `episode-${nextEp}`);
                
                // Prüfe ob nächste Episode existiert
                fetch(nextUrl, { method: 'HEAD' })
                    .then(response => {
                        if (response.ok) {
                            window.location.href = nextUrl;
                        }
                    })
                    .catch(() => console.log('Next episode not found'));
            }
        }

        blockAdsAndPopups() {
            // Blockiere Werbe-Elemente
            const adSelectors = [
                '[class*="ad"]',
                '[id*="ad"]',
                '[class*="werbung"]',
                '[class*="advertisement"]',
                '.ad-container',
                '.adsense',
                '.ad-banner',
                '.popup',
                '.overlay',
                '[onclick*="window.open"]',
                'iframe[src*="ad"]'
            ];

            adSelectors.forEach(selector => {
                try {
                    document.querySelectorAll(selector).forEach(el => {
                        if (this.isAdElement(el)) {
                            el.remove();
                        }
                    });
                } catch (e) {
                    console.log('Error removing element:', e);
                }
            });

            // Blockiere Popup-Funktionen
            this.disablePopups();
            
            // Periodische Bereinigung
            setInterval(() => {
                this.cleanupAds();
            }, 3000);
        }

        isAdElement(element) {
            if (!element) return false;
            
            const styles = window.getComputedStyle(element);
            const bounds = element.getBoundingClientRect();
            
            // Elemente außerhalb des Viewports oder unsichtbar
            if (styles.display === 'none' || styles.visibility === 'hidden') {
                return false;
            }

            // Typische Werbe-Größen
            const adSizes = [
                { width: 728, height: 90 },   // Leaderboard
                { width: 300, height: 250 },  // Medium Rectangle
                { width: 160, height: 600 },  // Wide Skyscraper
                { width: 300, height: 600 }   // Half Page
            ];

            const isAdSize = adSizes.some(size => 
                Math.abs(bounds.width - size.width) < 10 && 
                Math.abs(bounds.height - size.height) < 10
            );

            const text = element.textContent.toLowerCase();
            const adKeywords = ['werbung', 'advertisement', 'sponsor', 'anzeige', 'ad'];
            
            return isAdSize || adKeywords.some(keyword => text.includes(keyword));
        }

        disablePopups() {
            // Überschreibe window.open
            window.originalOpen = window.open;
            window.open = function() {
                console.log('Popup blocked by AniWorld Assistant');
                return null;
            };

            // Blockiere unerwünschte Redirects
            window.addEventListener('beforeunload', (e) => {
                if (e.target.activeElement && e.target.activeElement.href) {
                    const href = e.target.activeElement.href;
                    if (href.includes('popup') || href.includes('ad')) {
                        e.preventDefault();
                    }
                }
            });
        }

        cleanupAds() {
            // Entferne neu hinzugekommene Werbung
            document.querySelectorAll('div, iframe, ins').forEach(el => {
                if (this.isAdElement(el)) {
                    el.remove();
                }
            });
        }
    }

    // Warte auf DOM und initialisiere
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new AniWorldAssistant();
        });
    } else {
        new AniWorldAssistant();
    }
})();
