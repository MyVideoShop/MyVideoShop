const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const client = require('../../utils/mongoClient'); // MongoDB-Client

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Kategorien laden
const getCategories = () => {
  const file = path.join(__dirname, '../../data/categories.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
};

// Upload-Formular anzeigen
router.get('/', (req, res) => {
  res.render('admin-upload', { categories: getCategories(), success: false });
});

// Upload-POST-Handler
router.post('/', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;

  if (!req.file) {
    return res.status(400).send('Keine Datei hochgeladen.');
  }

  try {
    const db = client.db(); // Default-Datenbank
    const queue = db.collection('videoQueue');

    const categoryList = categories ? categories.split(',').map(c => c.trim()) : [];

    await queue.insertOne({
      _id: new ObjectId(),
      filepath: req.file.path,
      title,
      description,
      categories: categoryList,
      uploadDate: new Date(),
      status: 'pending'
    });

    res.render('admin-upload', {
      categories: getCategories(),
      success: true
    });
  } catch (err) {
    console.error('Fehler beim Einfügen in die Warteschlange:', err);
    res.status(500).send('Fehler beim Hochladen.');
  }
});

module.exports = router;
