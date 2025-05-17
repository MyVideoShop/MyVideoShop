const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// MongoDB-Verbindung
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/videoApp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log('Mit MongoDB verbunden')).catch(console.error);

// Modelle laden
const Video = require('./models/Video');

// Routen laden
const authRoutes = require('./routes/auth');
const supportRouter = require('./routes/support');
const adminSupportRouter = require('./routes/admin/support');
const adminStatsRouter = require('./routes/admin/stats');
const adminVideosRouter = require('./routes/admin/videos');
const adminUploadRouter = require('./routes/admin/upload'); // <-- Upload-Route

// Daten-Dateipfade
const statsFile = path.join(__dirname, 'data', 'visits.json');
const supportFile = path.join(__dirname, 'data', 'supportMessages.json');

// Sicherstellen, dass die Dateien vorhanden sind
if (!fs.existsSync(statsFile)) fs.writeFileSync(statsFile, JSON.stringify({ total: 0, online: 0 }));
if (!fs.existsSync(supportFile)) fs.writeFileSync(supportFile, JSON.stringify([]));

// Alte Supportnachrichten regelmäßig löschen
try {
  const SupportMessage = require('./models/SupportMessage');
  setInterval(async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SupportMessage.deleteMany({ createdAt: { $lt: weekAgo } });
  }, 6 * 60 * 60 * 1000); // Alle 6 Stunden
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
  cookie: { maxAge: 5 * 60 * 1000 },
}));

// EJS-Vorlagen
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Besucherzähler-Middleware
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

// Routenregistrierung
app.use('/support', supportRouter);
app.use('/admin/support', adminSupportRouter);
app.use('/admin/stats', adminStatsRouter);
app.use('/admin/videos', adminVideosRouter);
app.use('/admin/upload', adminUploadRouter); // <-- Upload-Route aktiv
app.use('/', authRoutes);

// Startseite mit allen Videos (öffentlich)
app.get('/', async (req, res) => {
  const referer = req.get('referer');
  const localHost = `${req.protocol}://${req.get('host')}`;

  if (!referer || !referer.startsWith(localHost)) {
    const stats = JSON.parse(fs.readFileSync(statsFile));
    stats.total += 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }

  try {
    const videos = await Video.find({ status: 'done' }).lean();
    const formatted = videos.map(v => ({
      id: v._id.toString(),
      title: v.title,
      description: v.description,
      iframeUrl: `/video/${v._id}`,
    }));
    res.render('index', { shopName: 'ShopMyVideos', videos: formatted });
  } catch (err) {
    console.error('Fehler beim Laden der Videos:', err);
    res.render('index', { shopName: 'ShopMyVideos', videos: [] });
  }
});

// Video weiterleiten (als Proxy)
app.get('/video/:id', async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    if (!video || !video.url) return res.status(404).send('Video nicht gefunden');
    res.redirect(video.url);
  } catch (err) {
    res.status(500).send('Fehler beim Weiterleiten des Videos');
  }
});

// Admin Startseite
app.get('/admin', (req, res) => {
  res.render('admin');
});

// Fehlerseite für nicht existierende Admin-Seiten
app.get('/admin/:section', (req, res) => {
  res.status(404).send('Diese Admin-Seite existiert nicht.');
});

// Creator-Profilseite
app.get('/creator/:name', (req, res) => {
  res.render('creator', { name: req.params.name });
});

// Serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
