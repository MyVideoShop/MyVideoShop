// routes/support.js
const express = require('express');
const router = express.Router();
const SupportMessage = require('../models/SupportMessage');

// Neue Nachricht speichern
router.post('/send', async (req, res) => {
  const { title, description } = req.body;
  if (!title || description.length < 10 || description.length > 200) {
    return res.status(400).send('Ungültige Eingabe.');
  }

  try {
    await SupportMessage.create({
      title,
      description,
      createdAt: new Date()
    });
    res.status(200).send('Nachricht gespeichert');
  } catch (err) {
    res.status(500).send('Fehler beim Speichern');
  }
});

// Alle Nachrichten für Admin anzeigen
router.get('/admin', async (req, res) => {
  try {
    const messages = await SupportMessage.find({}).sort({ createdAt: -1 });
    res.render('admin/support', { messages });
  } catch (err) {
    res.status(500).send('Fehler beim Laden');
  }
});

// Nachricht löschen
router.post('/delete/:id', async (req, res) => {
  try {
    await SupportMessage.findByIdAndDelete(req.params.id);
    res.status(200).send('Gelöscht');
  } catch (err) {
    res.status(500).send('Fehler beim Löschen');
  }
});

module.exports = router;
