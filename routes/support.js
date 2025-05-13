const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '..', 'data', 'supportMessages.json');
const MAX_MESSAGES = 500;

// Stelle sicher, dass Datei existiert
if (!fs.existsSync(filePath)) {
  fs.writeFileSync(filePath, '[]');
}

// In-Memory-Sperre zur Race-Condition-Vermeidung
let writeInProgress = false;

// Helferfunktion: Nachricht speichern (wartet bei parallelem Zugriff)
async function saveMessage(newMessage) {
  return new Promise((resolve, reject) => {
    const tryWrite = () => {
      if (writeInProgress) {
        return setTimeout(tryWrite, 20); // wiederholen bis frei
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

        // Wenn Limit erreicht: Nachricht verwerfen
        if (messages.length >= MAX_MESSAGES) {
          writeInProgress = false;
          return resolve(false); // nicht gespeichert
        }

        messages.unshift(newMessage); // neueste oben

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

router.post('/', async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send('Titel und Beschreibung sind erforderlich.');
  }

  const newMessage = {
    id: Date.now(),
    title,
    description,
    createdAt: new Date().toISOString()
  };

  try {
    const saved = await saveMessage(newMessage);
    if (saved) {
      res.status(200).send('Nachricht gesendet.');
    } else {
      // stiller Abbruch – Limit erreicht
      res.status(200).send('Nachricht wurde empfangen.');
    }
  } catch (err) {
    console.error('Fehler beim Speichern:', err);
    res.status(500).send('Serverfehler beim Speichern.');
  }
});

module.exports = router;
