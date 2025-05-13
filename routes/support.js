const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const messagesFile = path.join(__dirname, '../data/supportMessages.json');

router.post('/send', (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Titel und Beschreibung erforderlich.' });
  }

  const message = {
    id: Date.now().toString(),
    title,
    description,
    date: new Date().toISOString()
  };

  try {
    let messages = fs.existsSync(messagesFile)
      ? JSON.parse(fs.readFileSync(messagesFile))
      : [];

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => new Date(msg.date).getTime() > oneWeekAgo);

    messages.push(message);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));

    res.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Speichern der Nachricht:', err);
    res.status(500).json({ success: false, message: 'Serverfehler beim Speichern.' });
  }
});

module.exports = router;
