const express = require('express');
const router = express.Router();

// Dummy-Daten
const admins = [
  { name: 'admin', password: 'adminpass' }
];

const creators = [
  { name: 'creator1', password: 'creatorpass' }
];

router.post('/auth', (req, res) => {
  const { name, email, password, action } = req.body;

  if (action === 'apply') {
    if (!email) {
      return res.json({ success: false, message: 'Zum Bewerben wird eine E-Mail benötigt.' });
    }
    // Bewerbung abschicken (hier nur Konsolenausgabe)
    console.log(Neue Bewerbung: Name=${name}, Email=${email});
    return res.json({ success: true, message: 'Bewerbung gesendet!' });
  }

  if (action === 'login') {
    const admin = admins.find(u => u.name === name && u.password === password);
    if (admin) {
      return res.json({ success: true, redirect: '/admin' });
    }

    const creator = creators.find(u => u.name === name && u.password === password);
    if (creator) {
      return res.json({ success: true, redirect: /creator/${encodeURIComponent(name)} });
    }

    return res.json({ success: false, message: 'Ungültige Zugangsdaten.' });
  }

  res.status(400).json({ success: false, message: 'Ungültige Anfrage.' });
});

module.exports = router;

public/js/script.js

document.addEventListener('DOMContentLoaded', () => {
  const loginButton = document.getElementById('loginButton');
  const loginModal = document.getElementById('loginModal');
  const loginForm = document.getElementById('loginForm');
  const formMessage = document.getElementById('formMessage');

  loginButton.addEventListener('click', () => {
    loginModal.classList.remove('hidden');
  });

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(loginForm);
    const data = Object.fromEntries(formData.entries());

    formMessage.textContent = ''; // Reset message

    if (data.action === 'apply' && !data.email) {
      formMessage.textContent = 'Zum Bewerben wird eine E-Mail benötigt.';
      return;
    }

    try {
      const res = await fetch('/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const result = await res.json();
      formMessage.textContent = result.message;

      if (result.redirect) {
        window.location.href = result.redirect;
      }
    } catch (err) {
      formMessage.textContent = 'Ein Fehler ist aufgetreten.';
    }
  });
});
