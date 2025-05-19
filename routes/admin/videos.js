const express = require('express');
const multer = require('multer');
const path = require('fs');
const { MongoClient } = require('mongodb');
const B2 = require('backblaze-b2');
const router = express.Router();

// Temp-Verzeichnis für Uploads
const uploadDir = path.join(__dirname, '../../temp_uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Multer Konfiguration
const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      cb(null, `video_${Date.now()}${path.extname(file.originalname)}`);
    }
  }),
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB
});

// Backblaze Initialisierung
const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY
});

// POST /admin/videos/upload
router.post('/upload', upload.single('video'), async (req, res) => {
  let mongoClient;
  
  try {
    // Validierung
    if (!req.file || !req.body.title || !req.body.description || !req.body.categories) {
      throw new Error('Fehlende erforderliche Felder');
    }

    // 1. Backblaze Upload vorbereiten
    await b2.authorize();
    const uploadUrl = await b2.getUploadUrl({ 
      bucketId: process.env.B2_BUCKET_ID 
    });

    // 2. Datei in B2 hochladen
    const b2FileName = `videos/${req.file.filename}`;
    const fileData = fs.readFileSync(req.file.path);
    
    const b2Response = await b2.uploadFile({
      uploadUrl: uploadUrl.data.uploadUrl,
      uploadAuthToken: uploadUrl.data.authorizationToken,
      fileName: b2FileName,
      data: fileData,
      mime: req.file.mimetype
    });

    // 3. Metadaten in MongoDB speichern
    mongoClient = new MongoClient(process.env.MONGODB_URI);
    await mongoClient.connect();
    
    const videoDoc = {
      title: req.body.title,
      description: req.body.description,
      categories: JSON.parse(req.body.categories),
      status: 'pending',
      b2FileId: b2Response.data.fileId,
      b2FileName: b2FileName,
      originalName: req.file.originalname,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await mongoClient.db()
      .collection('videos')
      .insertOne(videoDoc);

    // 4. Erfolgsmeldung
    res.status(200).json({ 
      success: true,
      message: 'Video erfolgreich hochgeladen'
    });

  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    // Aufräumen
    if (req.file?.path) fs.unlinkSync(req.file.path);
    if (mongoClient) await mongoClient.close();
  }
});

module.exports = router;
