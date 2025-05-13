const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const SUPPORT_FILE = path.join(__dirname, '..', 'data', 'supportMessages.json');
const MAX_MESSAGES = 500;
let isWriting = false;

// Stelle sicher, dass Datei existiert
if (!fs.existsSync(SUPPORT_FILE)) {
  fs.writeFileSync(SUPPORT_FILE, JSON.stringify([]));
}

// Hilfsfunktion: Speichern mit Race-Schutz
function safeWriteSupportMessages(messages) {
  return new Promise((resolve, reject) => {
    const tryWrite = () => {
      if (!isWriting) {
        isWriting = true;
        fs.writeFile(SUPPORT_FILE, JSON.stringify(messages, null, 2), (err) => {
          isWriting = false;
          if (err) return reject(err);
          resolve();
        });
      } else {
        // Warte kurz und versuche es erneut
        setTimeout(tryWrite, 10);
      }
    };
    tryWrite();
  });
}

// POST /support
router.post('/', express.json(), async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'Titel und Beschreibung sind erforderlich.' });
  }

  try {
    let messages = JSON.parse(fs.readFileSync(SUPPORT_FILE));

    if (messages.length >= MAX_MESSAGES) {
      return res.status(429).json({ message: 'Limit erreicht. Es können keine weiteren Nachrichten gespeichert werden.' });
    }

    const newMessage = {
      id: Date.now(),
      title,
      description,
      createdAt: new Date().toISOString()
    };

    messages.push(newMessage);
    await safeWriteSupportMessages(messages);
    res.status(200).json({ message: 'Nachricht erfolgreich gesendet.' });
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    res.status(500).json({ message: 'Serverfehler beim Speichern der Nachricht.' });
  }
});

module.exports = router;
