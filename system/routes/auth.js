const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const Admin = require('../models/Admin');
const Creator = require('../models/Creator');

// Creator Login Formular
router.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect(req.session.user.role === 'admin' ? '/admin' : '/creator');
  }
  res.render('auth/login', { title: 'Login' });
});

// Login Verarbeitung
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // Erst als Admin prüfen
    const admin = await Admin.findOne({ username });
    if (admin && await admin.comparePassword(password)) {
      req.session.user = {
        id: admin._id,
        username: admin.username,
        role: 'admin',
        permissions: admin.permissions
      };
      admin.lastLogin = new Date();
      await admin.save();
      return res.redirect('/admin');
    }
    
    // Dann als Creator prüfen
    const creator = await Creator.findOne({ username, status: 'active' });
    if (creator && await creator.comparePassword(password)) {
      req.session.user = {
        id: creator._id,
        username: creator.username,
        role: 'creator',
        email: creator.email
      };
      creator.lastLogin = new Date();
      await creator.save();
      return res.redirect('/creator');
    }
    
    // Wenn nichts gefunden
    res.render('auth/login', { 
      title: 'Login', 
      error: 'Ungültige Zugangsdaten oder Konto nicht aktiviert.' 
    });
  } catch (err) {
    console.error('Login Fehler:', err);
    res.render('auth/login', { 
      title: 'Login', 
      error: 'Ein Fehler ist beim Login aufgetreten.' 
    });
  }
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) console.error('Logout Fehler:', err);
    res.redirect('/');
  });
});

// Creator Bewerbung Formular
router.get('/apply', (req, res) => {
  res.render('auth/apply', { title: 'Creator Bewerben' });
});

// Creator Bewerbung Verarbeitung
router.post('/apply', async (req, res) => {
  try {
    const { username, email, password, bio } = req.body;
    
    // Prüfen ob Benutzername oder Email bereits existiert
    const existingCreator = await Creator.findOne({ 
      $or: [{ username }, { email }] 
    });
    
    if (existingCreator) {
      return res.render('auth/apply', { 
        title: 'Creator Bewerben', 
        error: 'Benutzername oder Email bereits vergeben.' 
      });
    }
    
    // Neuen Creator erstellen (Status: pending)
    const newCreator = new Creator({
      username,
      email,
      password,
      bio,
      status: 'pending'
    });
    
    await newCreator.save();
    
    // Erfolgsmeldung anzeigen
    res.render('auth/apply-success', { 
      title: 'Bewerbung eingegangen',
      message: 'Vielen Dank für deine Bewerbung! Wir werden uns in Kürze bei dir melden.'
    });
  } catch (err) {
    console.error('Bewerbungsfehler:', err);
    res.render('auth/apply', { 
      title: 'Creator Bewerben', 
      error: 'Ein Fehler ist bei der Bewerbung aufgetreten.' 
    });
  }
});

module.exports = router;
