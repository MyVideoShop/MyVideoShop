const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const app = express();

// Routen
const authRoutes = require('./routes/auth');
const supportRouter = require('./routes/support');
const adminSupportRouter = require('./routes/admin/support');
const adminStatsRouter = require('./routes/admin/stats');
const adminVideosRouter = require('./routes/admin/videos');
const adminUploadRouter = require('./routes/admin/upload');

// Datenpfade
const statsFile = path.join(__dirname, 'data', 'visits.json');
const supportFile = path.join(__dirname, 'data', 'supportMessages.json');
const videosFile = path.join(__dirname, 'data', 'videos.json');
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videoApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('Mit MongoDB verbunden')).catch(console.error);

require('dotenv').config();

// Sicherstellen, dass Dateien vorhanden sind
if (!fs.existsSync(statsFile)) {
  fs.writeFileSync(statsFile, JSON.stringify({ total: 0, online: 0 }));
}
if (!fs.existsSync(supportFile)) {
  fs.writeFileSync(supportFile, JSON.stringify([]));
}
if (!fs.existsSync(videosFile)) {
  fs.writeFileSync(videosFile, JSON.stringify([]));
}

// Automatische Löschung alter Supportnachrichten
try {
  const SupportMessage = require('./models/SupportMessage');
  setInterval(async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SupportMessage.deleteMany({ createdAt: { $lt: weekAgo } });
  }, 6 * 60 * 60 * 1000);
} catch {
  console.warn('SupportMessage-Modell nicht gefunden – automatische Löschung deaktiviert');
}

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'geheimnis123',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 5 * 60 * 1000 }
}));

// View-Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Besucher-Online-Zähler
app.use((req, res, next) => {
  const stats = JSON.parse(fs.readFileSync(statsFile));
  if (!req.session.hasCountedOnline) {
    stats.online += 1;
    req.session.hasCountedOnline = true;
    setTimeout(() => {
      const updated = JSON.parse(fs.readFileSync(statsFile));
      updated.online = Math.max(0, updated.online - 1);
      fs.writeFileSync(statsFile, JSON.stringify(updated, null, 2));
    }, req.session.cookie.maxAge);
  }
  fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  next();
});

// Routen registrieren
app.use('/support', supportRouter);
app.use('/admin/support', adminSupportRouter);
app.use('/admin/stats', adminStatsRouter);
app.use('/admin/videos', adminVideosRouter);
app.use('/admin/upload', adminUploadRouter);
app.use('/', authRoutes);

// Startseite mit Videoliste
app.get('/', (req, res) => {
  const referer = req.get('referer');
  const localHost = `${req.protocol}://${req.get('host')}`;

  if (!referer || !referer.startsWith(localHost)) {
    const stats = JSON.parse(fs.readFileSync(statsFile));
    stats.total += 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }

  const videos = JSON.parse(fs.readFileSync(videosFile));
  res.render('index', { shopName: 'ShopMyVideos', videos });
});

// Admin-Startseite
app.get('/admin', (req, res) => {
  res.render('admin');
});

// Admin: Videos verwalten
app.get('/admin/videos', (req, res) => {
  const videos = JSON.parse(fs.readFileSync(videosFile));
  res.render('admin-videos', { videos });
});

// Creator-Profilseite
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

require('./utils/videoQueue'); // Warteschlangen-Worker aktivieren
