const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../data/videos.json');

router.get('/', (req, res) => {
  let videos = [];

  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      videos = JSON.parse(data);
    }
  } catch (err) {
    console.error('Fehler beim Laden der Videos:', err);
  }

  res.render('admin-videos', { videos });
});

module.exports = router;
