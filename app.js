const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// === Routen laden ===
const authRoutes = require('./routes/auth');
const supportRouter = require('./routes/support');
const adminSupportRouter = require('./routes/admin/support');
const adminStatsRouter = require('./routes/admin/stats');

// === Daten-Dateien ===
const statsFile = path.join(__dirname, 'data', 'visits.json');
const supportFile = path.join(__dirname, 'data', 'supportMessages.json');

if (!fs.existsSync(statsFile)) fs.writeFileSync(statsFile, JSON.stringify({ total: 0, online: 0 }));
if (!fs.existsSync(supportFile)) fs.writeFileSync(supportFile, JSON.stringify([]));

// Alte Supportnachrichten löschen
try {
  const SupportMessage = require('./models/SupportMessage');
  setInterval(async () => {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await SupportMessage.deleteMany({ createdAt: { $lt: weekAgo } });
  }, 6 * 60 * 60 * 1000);
} catch {
  console.warn('⚠️ SupportMessage-Modell nicht gefunden – automatische Löschung deaktiviert');
}

// === Middleware ===
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: 'geheimnis123',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 5 * 60 * 1000 },
}));

// === EJS-Vorlagen ===
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// === Besucherzähler ===
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

// === Routen ===
app.use('/support', supportRouter);
app.use('/admin/support', adminSupportRouter);
app.use('/admin/stats', adminStatsRouter);
app.use('/', authRoutes);

// === Startseite ===
app.get('/', async (req, res) => {
  const referer = req.get('referer');
  const localHost = `${req.protocol}://${req.get('host')}`;

  if (!referer || !referer.startsWith(localHost)) {
    const stats = JSON.parse(fs.readFileSync(statsFile));
    stats.total += 1;
    fs.writeFileSync(statsFile, JSON.stringify(stats, null, 2));
  }

// === Admin-UI ===
app.get('/admin', (req, res) => res.render('admin'));
app.get('/admin/:section', (req, res) => res.status(404).send('Diese Admin-Seite existiert nicht.'));
app.get('/creator/:name', (req, res) => res.render('creator', { name: req.params.name }));

// === Serverstart ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server läuft auf Port ${PORT}`));
