const express = require('express');
const cors = require('cors');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Einfacher Proxy der nichts am Content ändert
app.use('/proxy', createProxyMiddleware({
  target: 'https://aniworld.to', // Fallback
  changeOrigin: true,
  router: function(req) {
    // Dynamisches Target basierend auf der URL
    const targetUrl = new URL(req.url.replace('/proxy/', ''));
    return targetUrl.origin;
  },
  pathRewrite: function(path, req) {
    // Ursprüngliche Pfad wiederherstellen
    return path.replace('/proxy/', '');
  },
  onProxyReq: (proxyReq, req, res) => {
    // Header setzen für bessere Kompatibilität
    proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    proxyReq.setHeader('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8');
  }
}));

// Startseite
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Streaming Hub läuft auf Port ${PORT}`);
});
