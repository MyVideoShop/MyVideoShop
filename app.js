const express = require('express');
const app = express();
const path = require('path');
const authRoutes = require('./routes/auth');
// Admin-Platzhalterseiten
const adminPages = [
  'stats',
  'video-hochladen',
  'videos-verwalten',
  'gutscheine-erstellen',
  'gutscheine-verwalten',
  'admins-erstellen',
  'admins-verwalten',
  'creators-erstellen',
  'creators-verwalten',
  'support-nachrichten'
];

adminPages.forEach(page => {
  app.get(`/admin/${page}`, (req, res) => {
    res.render('admin-placeholder', { title: page.replace(/-/g, ' ') });
  });
});

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', authRoutes);

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

app.get('/admin/:section', (req, res) => {
  const section = req.params.section;
  res.send(`<h1 style="color:white; background:#121212; padding:2rem;">Placeholder: ${section}</h1><a href="/admin" style="color:cyan;">Zurück zum Dashboard</a>`);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
