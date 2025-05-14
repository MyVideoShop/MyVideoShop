const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Speicherort für Uploads
const uploadFolder = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadFolder)) fs.mkdirSync(uploadFolder);

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadFolder);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = Date.now() + ext;
    cb(null, filename);
  }
});

const upload = multer({ storage });

const { processVideo } = require('../../utils/videoProcessor');

// In POST /video:
router.post('/video', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;
  const filePath = req.file.path;

  try {
    const processedPath = await processVideo(filePath);
    
    // TODO: Hier folgt im nächsten Schritt der Upload zu Pixeldrain

    res.status(200).json({
      success: true,
      message: 'Video verarbeitet',
      processedPath
    });

  } catch (err) {
    console.error('Verarbeitung fehlgeschlagen:', err);
    res.status(500).json({ success: false, message: 'Verarbeitung fehlgeschlagen' });
  }
});

// Route: POST /admin/upload/video
router.post('/video', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;
  const filePath = req.file.path;

  // Nächster Schritt: Übergabe an Bot-Prozess
  // Hier rufen wir später z.B. `processUploadedVideo(filePath, title, ...)` auf

  res.status(200).json({ success: true, message: 'Video empfangen und gespeichert', filePath });
});

module.exports = router;
