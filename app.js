const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();

// Routen einbinden
const authRoutes = require('./routes/auth');
const adminStatsRoute = require('./routes/admin/stats');
const adminSupportRouter = require('./routes/admin/support');
const supportRouter = require('./routes/support');

// Besucher-Statistik-Datei
const statsFile = path.join(__dirname, 'data', 'visits.json');
if (!fs.existsSync(statsFile)) {
  fs.writeFileSync(statsFile, JSON.stringify({ total: 0, online: 0 }));
}

// Supportnachrichten-Model für automatische Löschung (nur wenn Mongoose genutzt wird)
let SupportMessage;
try {
  SupportMessage = require('./models/SupportMessage');
  setInterval(async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SupportMessage.deleteMany({ createdAt: { $lt: weekAgo } });
  }, 6 * 60 * 60 * 1000); // alle 6 Stunden prüfen
} catch (err) {
  console.warn('SupportMessage-Modell nicht gefunden – automatische Löschung deaktiviert');
}

// Middleware
app.use(express.static('public'));
app.use(express.json()); // für JSON-Anfragen
app.use(express.urlencoded({ extended: true })); // für Formulardaten

app.use(session({
  secret: 'geheimnis123', // In Produktion ändern
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 5 * 60 * 1000 } // 5 Minuten
}));

// View-Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Besucher-Online-Zähler
app.use((req, res, next) => {
  let stats = JSON.parse(fs.readFileSync(statsFile));

  if (!req.session.hasCountedOnline) {
    stats.online += 1;
    req.session.hasCountedOnline = true;

    // Automatisches Entfernen nach Ablauf der Session
    setTimeout(() => {
      let updated = JSON.parse(fs.readFileSync(statsFile));
      updated.online = Math.max(0, updated.online - 1);
      fs.writeFileSync(statsFile, JSON.stringify(updated, null, 2));
    }, req.session.cookie.maxAge);
  }

  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  next();
});

// Routen
app.use('/admin/support', adminSupportRouter);
app.use('/support', supportRouter);
app.use('/admin/stats', adminStatsRoute);
app.use('/', authRoutes);

// Startseite mit Besucherzähler (nur externe Aufrufe zählen)
app.get('/', (req, res) => {
  const referer = req.get('referer');
  const localHost = req.protocol + '://' + req.get('host');
  if (!referer || !referer.startsWith(localHost)) {
    let stats = JSON.parse(fs.readFileSync(statsFile));
    stats.total += 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }
  res.render('index', { shopName: 'ShopMyVideos' });
});

// Admin-Startseite
app.get('/admin', (req, res) => {
  res.render('admin');
});

// Creator-Bereich
app.get('/creator/:name', (req, res) => {
  const name = req.params.name;
  res.render('creator', { name });
});

// Fehlerseite für ungültige Admin-Unterseiten
app.get('/admin/:section', (req, res) => {
  res.status(404).send('Diese Admin-Seite existiert nicht.');
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
