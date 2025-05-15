const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ObjectId } = require('mongodb');
const client = require('../../utils/mongoClient');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

const getCategories = () => {
  const file = path.join(__dirname, '../../data/categories.json');
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : [];
};

// GET Upload-Seite
router.get('/', (req, res) => {
  res.render('admin-upload', { categories: getCategories(), success: false });
});

// POST Video-Upload
router.post('/', upload.single('video'), async (req, res) => {
  const { title, description, categories } = req.body;

  if (!req.file) {
    return res.status(400).send('Keine Datei hochgeladen.');
  }

  try {
    const db = client.db();
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

// POST Neue Kategorie anlegen
router.post('/category', (req, res) => {
  const newCategory = (req.body.newCategory || '').trim();
  if (!newCategory) return res.redirect('/admin/upload');

  const file = path.join(__dirname, '../../data/categories.json');
  let categories = [];

  if (fs.existsSync(file)) {
    categories = JSON.parse(fs.readFileSync(file));
  }

  if (!categories.includes(newCategory)) {
    categories.push(newCategory);
    fs.writeFileSync(file, JSON.stringify(categories, null, 2));
  }

  res.redirect('/admin/upload');
});

module.exports = router;
