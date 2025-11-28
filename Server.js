const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Proxy-Routen für verschiedene Streaming-Seiten
app.get('/proxy/aniworld', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('URL parameter required');
    }
    
    // Hier würde der eigentliche Proxy-Code stehen
    // Dies ist eine vereinfachte Darstellung
    res.send(`Proxy für Aniworld: ${targetUrl}`);
  } catch (error) {
    res.status(500).send('Proxy Fehler');
  }
});

app.get('/proxy/sto', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('URL parameter required');
    }
    
    res.send(`Proxy für s.to: ${targetUrl}`);
  } catch (error) {
    res.status(500).send('Proxy Fehler');
  }
});

app.get('/proxy/lookmovies', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) {
      return res.status(400).send('URL parameter required');
    }
    
    res.send(`Proxy für LookMovies: ${targetUrl}`);
  } catch (error) {
    res.status(500).send('Proxy Fehler');
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Streaming Hub läuft auf Port ${PORT}`);
});
