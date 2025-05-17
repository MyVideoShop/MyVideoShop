const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const { uploadVideo } = require('../utils/uploadVideos');

const mongoUri = process.env.MONGODB_URI;
const client = new MongoClient(mongoUri);
const dbName = process.env.MONGODB_DB_NAME || 'videoshop';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '..', 'temp');
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath);
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `${uuidv4()}${ext}`;
    cb(null, filename);
  }
});
const upload = multer({ storage: storage });

router.post('/', upload.single('videoFile'), async (req, res) => {
  const { title, description, categories } = req.body;
  const filePath = req.file.path;
  const originalName = req.file.originalname;
  const fileName = req.file.filename;

  if (!title || !description || !categories || !filePath) {
    return res.status(400).send('Alle Felder sind erforderlich.');
  }

  try {
    await client.connect();
    const db = client.db(dbName);
    const queue = db.collection('videoQueue');

    // ⬆️ Hochladen zu Backblaze B2
    await uploadVideo(filePath, fileName);

    // ⬇️ In Queue eintragen
    await queue.insertOne({
      title,
      description,
      categories: Array.isArray(categories) ? categories : [categories],
      fileName,
      originalName,
      status: 'pending',
      createdAt: new Date()
    });

    // 🧹 Temporäre Datei löschen
    fs.unlinkSync(filePath);

    res.redirect('/admin/upload?success=1');
  } catch (error) {
    console.error('Fehler beim Video-Upload:', error);
    res.status(500).send('Fehler beim Upload');
  }
});

module.exports = router;
