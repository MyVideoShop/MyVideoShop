const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const messagesFile = path.join(__dirname, '../../data/supportMessages.json');

// GET /admin/support – Support-Seite anzeigen
router.get('/', (req, res) => {
  try {
    let messages = [];
    if (fs.existsSync(messagesFile)) {
      messages = JSON.parse(fs.readFileSync(messagesFile));
    }

    // Alte Nachrichten (>7 Tage) rausfiltern
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => new Date(msg.date).getTime() > oneWeekAgo);

    res.render('admin-support', { messages });
  } catch (err) {
    console.error('Fehler beim Laden der Supportseite:', err);
    res.status(500).send('Fehler beim Laden der Seite');
  }
});

// POST /support/send – Nachricht speichern
router.post('/send', (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).send('Titel und Beschreibung erforderlich.');
  }

  const message = {
    id: Date.now().toString(),
    title,
    description,
    date: new Date().toISOString()
  };

  try {
    let messages = [];
    if (fs.existsSync(messagesFile)) {
      messages = JSON.parse(fs.readFileSync(messagesFile));
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => new Date(msg.date).getTime() > oneWeekAgo);

    messages.push(message);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));

    res.redirect('/');
  } catch (err) {
    console.error('Fehler beim Speichern der Nachricht:', err);
    res.status(500).send('Fehler beim Speichern');
  }
});

// GET /admin/support/messages – Liste der Nachrichten (JSON)
router.get('/messages', (req, res) => {
  try {
    let messages = [];
    if (fs.existsSync(messagesFile)) {
      messages = JSON.parse(fs.readFileSync(messagesFile));
    }

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => new Date(msg.date).getTime() > oneWeekAgo);

    res.json(messages);
  } catch (err) {
    console.error('Fehler beim Lesen der Nachrichten:', err);
    res.status(500).send('Fehler beim Lesen');
  }
});

// DELETE /admin/support/delete/:id – Nachricht löschen
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  try {
    let messages = [];
    if (fs.existsSync(messagesFile)) {
      messages = JSON.parse(fs.readFileSync(messagesFile));
    }

    messages = messages.filter(msg => msg.id !== id);
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
    res.status(200).send('Nachricht gelöscht');
  } catch (err) {
    console.error('Fehler beim Löschen:', err);
    res.status(500).send('Fehler beim Löschen');
  }
});

module.exports = router;
