const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

const authRoutes = require('./routes/auth');
const adminStatsRoute = require('./routes/admin/stats');

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

let statsFile = path.join(__dirname, 'data', 'visits.json');

// Stelle sicher, dass Datei existiert
if (!fs.existsSync(statsFile)) {
  fs.writeFileSync(statsFile, JSON.stringify({ total: 0, online: 0 }));
}

// Middleware: Besucher online zählen
app.use((req, res, next) => {
  const ip = req.ip;
  res.on('finish', () => {
    // keine persistente Online-Berechnung — optional erweiterbar mit Sessions/IP-Zeitstempel
  });
  next();
});

app.use('/admin/stats', adminStatsRoute);
app.use('/', authRoutes);

// Nur bei direktem Einstieg über die Startseite erhöhen
app.get('/', (req, res) => {
  const referer = req.get('referer');
  if (!referer || !referer.startsWith(req.protocol + '://' + req.get('host'))) {
    let stats = JSON.parse(fs.readFileSync(statsFile));
    stats.total += 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }
  res.render('index', { shopName: 'ShopMyVideos' });
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.get('/creator/:name', (req, res) => {
  const name = req.params.name;
  res.render('creator', { name });
});

// Bereits vorhanden (bleibt bestehen)
app.get('/admin/:section', (req, res) => {
  res.status(404).send('Diese Admin-Seite existiert nicht.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
