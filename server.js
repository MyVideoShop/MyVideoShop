require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();

// Template Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware: Altersprüfung
app.use((req, res, next) => {
  if (!req.query.ageConfirmed && req.path !== '/age-check') {
    return res.redirect('/age-check');
  }
  next();
});

// Routen
app.get('/age-check', (req, res) => {
  res.render('age-check', { shopName: process.env.SHOP_NAME });
});

app.get('/', (req, res) => {
  res.render('index', { shopName: process.env.SHOP_NAME });
});

// Serverstart
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
