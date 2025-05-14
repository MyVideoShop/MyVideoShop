const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { addToQueue } = require('../../utils/videoQueue');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Kategorien laden (falls verwendet)
const getCategories = () => {
  const file = path.join(__dirname, '../../data/categories.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
};

router.get('/', (req, res) => {
  res.render('admin-upload', { categories: getCategories(), success: false });
});

router.post('/', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;

  if (!req.file) {
    return res.status(400).send('Keine Datei hochgeladen.');
  }

  addToQueue(req.file.path, {
    title,
    description,
    categories: categories ? categories.split(',').map(c => c.trim()) : []
  });

  // Seite erneut anzeigen mit "wird verarbeitet"
  res.render('admin-upload', {
    categories: getCategories(),
    success: true
  });
});

module.exports = router;
