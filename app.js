require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

// Routen imports
const authRoutes = require('./routes/auth');
const supportRoutes = require('./routes/support');
const adminSupportRoutes = require('./routes/admin/support');
const adminStatsRoutes = require('./routes/admin/stats');
const videoRoutes = require('./routes/admin/videos');

const app = express();

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Mit MongoDB verbunden'))
  .catch(err => console.error('❌ MongoDB Verbindungsfehler:', err));

// Middleware
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'geheimer_schluessel',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// EJS Konfiguration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routen
app.use('/auth', authRoutes);
app.use('/support', supportRoutes);
app.use('/admin/support', adminSupportRoutes);
app.use('/admin/stats', adminStatsRoutes);
app.use('/admin/videos', videoRoutes);

// Hauptrouten
app.get('/', (req, res) => {
  res.render('index', { 
    shopName: process.env.SHOP_NAME || 'MyVideoShop' 
  });
});

app.get('/admin', (req, res) => res.render('admin'));
app.get('/creator/:name', (req, res) => {
  res.render('creator', { name: req.params.name });
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('❌ Serverfehler:', err.stack);
  res.status(500).send('Ein Serverfehler ist aufgetreten');
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
