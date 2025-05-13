const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '..', 'data', 'supportMessages.json');
const MAX_MESSAGES = 500;

// Datei anlegen, falls nicht vorhanden
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, '[]');
}

// Race-Condition-Vermeidung per Sperre
let writeInProgress = false;

// Nachricht sicher speichern
async function saveMessage(newMessage) {
  return new Promise((resolve, reject) => {
    const tryWrite = () => {
      if (writeInProgress) {
        return setTimeout(tryWrite, 20);
      }

      writeInProgress = true;

      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          writeInProgress = false;
          return reject(err);
        }

        let messages = [];
        try {
          messages = JSON.parse(data);
        } catch (e) {
          messages = [];
        }

        if (messages.length >= MAX_MESSAGES) {
          writeInProgress = false;
          return resolve(false); // nicht gespeichert – Limit erreicht
        }

        messages.unshift(newMessage);

        fs.writeFile(filePath, JSON.stringify(messages, null, 2), (err) => {
          writeInProgress = false;
          if (err) return reject(err);
          resolve(true); // erfolgreich gespeichert
        });
      });
    };

    tryWrite();
  });
}

// POST /support/send – Supportnachricht speichern
router.post('/send', async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ success: false, message: 'Titel und Beschreibung sind erforderlich.' });
  }

  const newMessage = {
    id: Date.now().toString(),
    title,
    description,
    date: new Date().toISOString()
  };

  try {
    const saved = await saveMessage(newMessage);

    if (saved) {
      res.status(200).json({ success: true, message: 'Nachricht erfolgreich gespeichert.' });
    } else {
      res.status(200).json({ success: true, message: 'Nachrichtenlimit erreicht. Nachricht nicht gespeichert.' });
    }
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    res.status(500).json({ success: false, message: 'Serverfehler beim Speichern.' });
  }
});

module.exports = router;
