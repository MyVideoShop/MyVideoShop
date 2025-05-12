const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');

const authRoutes = require('./routes/auth');
const adminStatsRoute = require('./routes/admin/stats');

// Middleware: Besucherzähler bei jedem Seitenaufruf erhöhen
const statsFile = path.join(__dirname, 'data/stats.json');
app.use((req, res, next) => {
  try {
    const stats = JSON.parse(fs.readFileSync(statsFile, 'utf8'));
    stats.visitors.total += 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  } catch (err) {
    console.error('Fehler beim Besucherzähler:', err);
  }
  next();
});

// Middleware + Konfiguration
app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routen
app.use('/', authRoutes);
app.use('/admin/stats', adminStatsRoute);

app.get('/', (req, res) => {
  res.render('index', { shopName: 'ShopMyVideos' });
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.get('/creator/:name', (req, res) => {
  const name = req.params.name;
  res.render('creator', { name });
});

// Muss am Ende stehen:
app.get('/admin/:section', (req, res) => {
  res.status(404).send('Diese Admin-Seite existiert nicht.');
});

// Serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
