require('dotenv').config();
const express = require('express');
const session = require('express-session');
const mongoose = require('mongoose');
const path = require('path');
const MongoStore = require('connect-mongo');
const { v4: uuidv4 } = require('uuid');

// Express App erstellen
const app = express();

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Mit MongoDB verbunden'))
  .catch(err => console.error('❌ MongoDB Verbindungsfehler:', err));

// Session Konfiguration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: { 
    maxAge: 24 * 60 * 60 * 1000, // 1 Tag
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true
  },
  genid: () => uuidv4()
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// EJS als Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Routen importieren
const indexRoutes = require('./system/routes/index');
const adminRoutes = require('./system/routes/admin');
const creatorRoutes = require('./system/routes/creator');
const customerRoutes = require('./system/routes/customer');
const authRoutes = require('./system/routes/auth');
const apiRoutes = require('./system/routes/api');

// Routen verwenden
app.use('/', indexRoutes);
app.use('/admin', adminRoutes);
app.use('/creator', creatorRoutes);
app.use('/customer', customerRoutes);
app.use('/auth', authRoutes);
app.use('/api', apiRoutes);

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Fehler', 
    message: 'Ein Serverfehler ist aufgetreten.' 
  });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'Nicht gefunden', 
    message: 'Die angeforderte Seite existiert nicht.' 
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
