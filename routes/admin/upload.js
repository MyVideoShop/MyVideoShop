const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { processAndUploadVideo } = require('../../utils/videoProcessor');

// Speicherort für hochgeladene Videos
const uploadDir = path.join(__dirname, '../../uploads');
const fs = require('fs');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer-Upload-Handler
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Route: GET /admin/upload – Seite anzeigen
router.get('/', (req, res) => {
  res.render('admin-upload');
});

// Route: POST /admin/upload – Video verarbeiten
router.post('/', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;

  if (!req.file) {
    return res.status(400).send('Keine Datei hochgeladen.');
  }

  try {
    const pixeldrainLink = await processAndUploadVideo(req.file.path);
    // Video-Daten lokal speichern
    const videoDataFile = path.join(__dirname, '../../data/videos.json');
    const videos = fs.existsSync(videoDataFile) ? JSON.parse(fs.readFileSync(videoDataFile)) : [];

    videos.unshift({
      id: Date.now(),
      title,
      description,
      categories: categories ? categories.split(',').map(s => s.trim()) : [],
      url: pixeldrainLink,
      date: new Date().toISOString()
    });

    fs.writeFileSync(videoDataFile, JSON.stringify(videos, null, 2));
    res.redirect('/admin/videos');
  } catch (err) {
    console.error('Fehler beim Verarbeiten des Videos:', err);
    res.status(500).send('Fehler beim Verarbeiten des Videos.');
  }
});

module.exports = router;
