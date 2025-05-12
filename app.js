const express = require('express');
const app = express();
const path = require('path');

app.use(express.static('public'));
app.use(express.json());
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index', { shopName: 'ShopMyVideos' });
});

app.post('/auth', (req, res) => {
  const { name, email, password, action } = req.body;

  if (action === 'apply') {
    if (!email) {
      return res.json({ message: 'Zum Bewerben wird eine E-Mail benötigt.' });
    }
    // Bewerbung speichern
    return res.json({ message: 'Bewerbung gesendet!' });
  }

  if (action === 'login') {
    // Logik für Creator/Admin Login
    if (name === 'admin' && password === 'adminpass') {
      return res.json({ message: 'Admin Login erfolgreich!', redirect: '/admin' });
    } else if (name === 'creator' && password === 'creatorpass') {
      return res.json({ message: 'Creator Login erfolgreich!', redirect: '/creator' });
    } else {
      return res.json({ message: 'Ungültige Zugangsdaten.' });
    }
  }

  res.json({ message: 'Unbekannte Aktion.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(Server läuft auf Port ${PORT}));
