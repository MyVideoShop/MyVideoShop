  const express = require('express');
  const router = express.Router();
  const SupportMessage = require('../../models/SupportMessage');

  router.get('/', async (req, res) => {
    try {
      const messages = await SupportMessage.find().sort({ createdAt: -1 });
      res.render('admin-support', { messages });
    } catch (err) {
      console.error('Fehler beim Laden der Support-Nachrichten:', err);
      res.status(500).send('Interner Serverfehler');
    }
  });

  module.exports = router;
