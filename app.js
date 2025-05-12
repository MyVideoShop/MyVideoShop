const express = require('express');
const path = require('path');
const app = express();
const authRoutes = require('./routes/auth');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/', authRoutes);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/creator', (req, res) => {
  res.render('creator');
});

app.get('/admin', (req, res) => {
  res.render('admin');
});

const adminPages = [
  { route: 'upload', title: 'Video hochladen' },
  { route: 'vouchers', title: 'Gutscheine erstellen' },
  { route: 'manage-creators', title: 'Creator verwalten' },
  { route: 'manage-categories', title: 'Kategorien verwalten' },
  { route: 'settings', title: 'Einstellungen' },
];

adminPages.forEach(page => {
  app.get(`/admin/${page.route}`, (req, res) => {
    res.render('admin-placeholder', { title: page.title });
  });
});

// Admin-Stats speziell laden
app.get('/admin/stats', (req, res) => {
  res.render('admin-stats');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
