const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();
const authRoutes = require('./routes/auth');
const adminStatsRoute = require('./routes/admin/stats');
const statsFile = path.join(__dirname, 'data', 'visits.json');

// Stelle sicher, dass Datei existiert
if (!fs.existsSync(statsFile)) {
  fs.writeFileSync(statsFile, JSON.stringify({ total: 0, online: 0 }));
}

const supportRoutes = require('./routes/support');
const SupportMessage = require('./models/SupportMessage');

app.use('/support', supportRoutes);

// Supportnachrichten älter als 7 Tage automatisch löschen
setInterval(async () => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  await SupportMessage.deleteMany({ createdAt: { $lt: weekAgo } });
}, 6 * 60 * 60 * 1000); // alle 6 Stunden prüfen

// Session-Konfiguration
app.use(session({
  secret: 'geheimnis123', // ändere das in Produktion!
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 5 * 60 * 1000 } // Session läuft nach 5 Min Inaktivität ab
}));

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware: Online-Zähler aktualisieren
app.use((req, res, next) => {
  let stats = JSON.parse(fs.readFileSync(statsFile));

  // Prüfe, ob die Session bereits gezählt wurde
  if (!req.session.hasCountedOnline) {
    stats.online += 1;
    req.session.hasCountedOnline = true;

    // Entferne Online-Zähler bei Session-Ende automatisch (nach Ablauf siehe unten)
    setTimeout(() => {
      let updated = JSON.parse(fs.readFileSync(statsFile));
      updated.online = Math.max(0, updated.online - 1);
      fs.writeFileSync(statsFile, JSON.stringify(updated, null, 2));
    }, req.session.cookie.maxAge);
  }

  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  next();
});

app.use('/admin/stats', adminStatsRoute);
app.use('/', authRoutes);

// Nur Aufrufe von außen zählen
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

app.get('/admin/:section', (req, res) => {
  res.status(404).send('Diese Admin-Seite existiert nicht.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
