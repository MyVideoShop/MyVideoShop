const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const messagesFile = path.join(__dirname, '../../data/supportMessages.json');

// GET /admin/support – Seite anzeigen
router.get('/', (req, res) => {
  try {
    let messages = fs.existsSync(messagesFile)
      ? JSON.parse(fs.readFileSync(messagesFile))
      : [];

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => new Date(msg.date).getTime() > oneWeekAgo);

    res.render('admin-support', { messages });
  } catch (err) {
    console.error('Fehler beim Laden der Supportseite:', err);
    res.status(500).send('Fehler beim Laden der Seite');
  }
});

// GET /admin/support/messages – JSON-Liste für Admin
router.get('/messages', (req, res) => {
  try {
    let messages = fs.existsSync(messagesFile)
      ? JSON.parse(fs.readFileSync(messagesFile))
      : [];

    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    messages = messages.filter(msg => new Date(msg.date).getTime() > oneWeekAgo);

    res.json(messages);
  } catch (err) {
    console.error('Fehler beim Lesen der Nachrichten:', err);
    res.status(500).send('Fehler beim Lesen');
  }
});

// POST /admin/support/delete/:id – Nachricht löschen
router.post('/delete/:id', (req, res) => {
  try {
    let messages = fs.existsSync(messagesFile)
      ? JSON.parse(fs.readFileSync(messagesFile))
      : [];

    const idToDelete = req.params.id;
    const filteredMessages = messages.filter(msg => String(msg.id) !== String(idToDelete));

    fs.writeFileSync(messagesFile, JSON.stringify(filteredMessages, null, 2));
    res.redirect('/admin/support');
  } catch (err) {
    console.error('Fehler beim Löschen der Nachricht:', err);
    res.status(500).send('Fehler beim Löschen');
  }
});


module.exports = router;
