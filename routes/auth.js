const express = require('express');
const router = express.Router();

const admins = [{ name: 'admin', password: 'adminpass' }];
const creators = [{ name: 'creator', password: 'creatorpass' }];

router.post('/auth', (req, res) => {
  const { name, email, password, action } = req.body;

  if (action === 'apply') {
    if (!email) {
      return res.json({ success: false, message: 'Zum Bewerben wird eine E-Mail benötigt.' });
    }
    console.log(`Bewerbung: ${name}, ${email}`);
    return res.json({ success: true, message: 'Bewerbung gesendet!' });
  }

  if (action === 'login') {
    const admin = admins.find(u => u.name === name && u.password === password);
    if (admin) {
      return res.json({ success: true, redirect: '/admin', message: 'Admin Login erfolgreich!' });
    }

    const creator = creators.find(u => u.name === name && u.password === password);
    if (creator) {
      return res.json({ success: true, redirect: /creator/${encodeURIComponent(name)}, message: 'Creator Login erfolgreich!' });
    }

    return res.json({ success: false, message: 'Ungültige Zugangsdaten.' });
  }

  return res.status(400).json({ success: false, message: 'Ungültige Aktion.' });
});

module.exports = router;
