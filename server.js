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

// Dummy Creator/Admin-DB für Test
const creators = [{ name: 'creator1', password: 'pass1' }];
const admins = [{ name: 'admin1', password: 'adminpass' }];

app.post('/auth', (req, res) => {
  const { name, email, password, action } = req.body;

  if (action === 'apply') {
    // Bewerbung → später: in DB speichern und im Adminpanel anzeigen
    console.log('Neue Bewerbung:', { name, email, password, timestamp: Date.now() });
    return res.json({ message: 'Bewerbung erfolgreich eingereicht. Wird geprüft.' });
  }

  if (action === 'login') {
    const isAdmin = admins.find(a => a.name === name && a.password === password);
    const isCreator = creators.find(c => c.name === name && c.password === password);

    if (isAdmin) return res.json({ message: 'Admin Login erfolgreich!', redirect: '/admin' });
    if (isCreator) return res.json({ message: 'Creator Login erfolgreich!', redirect: '/creator' });

    return res.json({ message: 'Login fehlgeschlagen. Ungültige Daten.' });
  }

  res.json({ message: 'Ungültige Aktion.' });
});
