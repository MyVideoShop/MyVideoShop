const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const statsPath = path.join(__dirname, '../../data/stats.json');

// Hilfsfunktion zum Einlesen der Statistikdaten
function loadStats() {
  try {
    const data = fs.readFileSync(statsPath);
    return JSON.parse(data);
  } catch (err) {
    console.error('Fehler beim Lesen der Statistikdaten:', err);
    return null;
  }
}

router.get('/', (req, res) => {
  const stats = loadStats();
  if (!stats) return res.status(500).send('Fehler beim Laden der Statistiken');

  res.render('admin-stats', {
    revenue: stats.revenue,
    creators: stats.creators,
    categories: stats.categories,
    visitors: stats.visitors
  });
});

module.exports = router;
