const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const filePath = path.join(__dirname, '../../data/supportMessages.json');

// Route: GET /admin/support – Nachrichten anzeigen
router.get('/', (req, res) => {
  let messages = [];

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      messages = JSON.parse(data);
    }
  } catch (err) {
    console.error('Fehler beim Laden der Nachrichten:', err);
  }

  res.render('admin-support', { messages });
});

// Route: POST /admin/support/delete/:id – Nachricht löschen
router.post('/delete/:id', (req, res) => {
  const idToDelete = req.params.id;

  try {
    let messages = [];

    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      messages = JSON.parse(data);
    }

    const filteredMessages = messages.filter(msg => String(msg.id) !== String(idToDelete));

    fs.writeFileSync(filePath, JSON.stringify(filteredMessages, null, 2));
    console.log(`Nachricht mit ID ${idToDelete} gelöscht`);

    res.redirect('/admin/support');
  } catch (err) {
    console.error('Fehler beim Löschen der Nachricht:', err);
    res.status(500).send('Fehler beim Löschen der Nachricht.');
  }
});

module.exports = router;
