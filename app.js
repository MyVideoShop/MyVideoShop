const express = require('express');
const app = express();
const path = require('path');
const authRoutes = require('./routes/auth');
const adminStatsRoute = require('./routes/admin/stats');
app.use('/admin/stats', adminStatsRoute);

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

app.get('/admin/stats', (req, res) => {
  res.render('admin-stats');
});

// Muss am Ende stehen:
app.get('/admin/:section', (req, res) => {
  res.status(404).send('Diese Admin-Seite existiert nicht.');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
