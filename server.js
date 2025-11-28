const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Startseite
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Enhancer Script bereitstellen
app.get('/enhancer.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'enhancer.js'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Streaming Hub läuft auf Port ${PORT}`);
});
