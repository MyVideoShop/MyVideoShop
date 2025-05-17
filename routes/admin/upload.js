const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const client = require('../../utils/mongoClient');

// Upload-Verzeichnis
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log('✅ Upload-Verzeichnis erstellt:', uploadDir);
}

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

// Kategorien einlesen
const getCategories = () => {
  const file = path.join(__dirname, '../../data/categories.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
};

// Upload-Seite (GET)
router.get('/', (req, res) => {
  res.render('admin-upload', {
    categories: getCategories(),
    success: false,
    error: null,
    message: null
  });
});

// Video-Upload (POST)
router.post('/', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;
  const logs = [];

  if (!req.file) {
    const error = '❌ Keine Datei hochgeladen.';
    console.error(error);
    return res.render('admin-upload', {
      categories: getCategories(),
      success: false,
      error,
      message: null
    });
  }

  try {
    logs.push('✅ Datei empfangen:', req.file.filename);
    const db = client.db();
    const queue = db.collection('videoQueue');

    const categoryList = categories
      ? categories.split(',').map((c) => c.trim()).filter(Boolean)
      : [];

    const videoData = {
      _id: new ObjectId(),
      filepath: req.file.path,
      title,
      description,
      categories: categoryList,
      uploadDate: new Date(),
      status: 'pending'
    };

    logs.push('📥 In Warteschlange einfügen:', videoData);

    await queue.insertOne(videoData);
    logs.push('✅ Erfolgreich in die Datenbank-Warteschlange eingefügt.');

    res.render('admin-upload', {
      categories: getCategories(),
      success: true,
      error: null,
      message: `Video "${title}" erfolgreich hochgeladen.`,
    });
  } catch (err) {
    const errorMsg = '❌ Fehler beim Einfügen in die Warteschlange: ' + err.message;
    console.error(errorMsg);
    res.render('admin-upload', {
      categories: getCategories(),
      success: false,
      error: errorMsg,
      message: null,
    });
  }
});

// Neue Kategorie hinzufügen
router.post('/category', (req, res) => {
  const newCategory = (req.body.newCategory || '').trim();
  const file = path.join(__dirname, '../../data/categories.json');

  if (!newCategory) {
    console.warn('⚠️ Leere Kategorie wurde eingereicht.');
    return res.redirect('/admin/upload');
  }

  let categories = [];
  if (fs.existsSync(file)) {
    categories = JSON.parse(fs.readFileSync(file));
  }

  if (!categories.includes(newCategory)) {
    categories.push(newCategory);
    fs.writeFileSync(file, JSON.stringify(categories, null, 2));
    console.log('✅ Neue Kategorie hinzugefügt:', newCategory);
  } else {
    console.log('ℹ️ Kategorie existiert bereits:', newCategory);
  }

  res.redirect('/admin/upload');
});

module.exports = router;
