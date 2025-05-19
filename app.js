import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// ES Module __dirname Ersatz
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Routen imports
import authRoutes from './routes/auth.js';
import supportRoutes from './routes/support.js';
import adminSupportRoutes from './routes/admin/support.js';
import adminStatsRoutes from './routes/admin/stats.js';
import videoRoutes from './routes/admin/videos.js';

const app = express();

// MongoDB Verbindung
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Mit MongoDB verbunden'))
  .catch(err => console.error('❌ MongoDB Verbindungsfehler:', err));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'geheimer_schluessel',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 5 * 60 * 1000 // 5 Minuten
  }
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
  try {
    const stats = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'visits.json')));
    stats.total += 1;
    fs.writeFileSync(path.join(__dirname, 'data', 'visits.json'), JSON.stringify(stats));
    
    res.render('index', { 
      shopName: process.env.SHOP_NAME || 'MyVideoShop' 
    });
  } catch (err) {
    console.error('Startseitenfehler:', err);
    res.status(500).render('error', { message: 'Serverfehler' });
  }
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

app.get('/creator/:name', (req, res) => {
  res.render('creator', { name: req.params.name });
});

// Fehlerbehandlung
app.use((err, req, res, next) => {
  console.error('❌ Serverfehler:', err.stack);
  res.status(500).render('error', { 
    message: 'Ein Serverfehler ist aufgetreten',
    error: process.env.NODE_ENV === 'development' ? err.stack : null
  });
});

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server läuft auf http://localhost:${PORT}`);
});
