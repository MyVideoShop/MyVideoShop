const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
require('dotenv').config();

const { b2, connectToBackblaze } = require('../utils/b2');

const router = express.Router();

// Multer-Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'temp/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname),
});
const upload = multer({ storage });

router.post('/upload', upload.single('video'), async (req, res) => {
  const inputPath = req.file?.path;
  const outputFilename = 'compressed-' + req.file?.filename;
  const outputPath = path.join('temp', outputFilename);
  const logs = [];

  if (!req.file) {
    logs.push('❌ Keine Datei hochgeladen.');
    return res.status(400).render('upload-result', { success: false, logs });
  }

  try {
    // Schritt 1: Komprimieren
    logs.push('🔄 Starte Komprimierung...');
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vcodec libx264',
          '-crf 28',
          '-preset veryfast',
          '-acodec aac',
          '-b:a 128k',
        ])
        .on('end', () => {
          logs.push('✅ Komprimierung abgeschlossen.');
          resolve();
        })
        .on('error', (err) => {
          logs.push('❌ Fehler bei der Komprimierung: ' + err.message);
          reject(err);
        })
        .save(outputPath);
    });

    logs.push('📦 Lade Datei und berechne SHA1...');
    const fileBuffer = fs.readFileSync(outputPath);
    const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

    // Schritt 2: Authentifizierung (falls nötig)
    if (!b2.authorizationToken) {
      logs.push('🔐 Authentifiziere bei B2...');
      await connectToBackblaze();
    }

    // Schritt 3: Upload-URL holen
    logs.push('🌐 Hole Upload-URL...');
    const uploadUrlRes = await b2.getUploadUrl({ bucketId: process.env.B2_BUCKET_ID });
    const { uploadUrl, authorizationToken: uploadAuthToken } = uploadUrlRes.data;
    logs.push('✅ Upload-URL erhalten.');

    // Schritt 4: Datei hochladen
    logs.push('📤 Lade Datei hoch...');
    await b2.uploadFile({
      uploadUrl,
      uploadAuthToken,
      fileName: outputFilename,
      data: fileBuffer,
      contentType: 'b2/x-auto',
      hash: sha1,
    });
    logs.push('✅ Upload erfolgreich.');

    const publicUrl = `https://f000.backblazeb2.com/file/${process.env.B2_BUCKET_NAME}/${encodeURIComponent(outputFilename)}`;
    logs.push('🔗 Öffentliche URL: ' + publicUrl);

    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);
    logs.push('🧹 Temporäre Dateien gelöscht.');

    res.render('upload-result', { success: true, url: publicUrl, logs });
  } catch (error) {
    const msg = error.response?.data || error.message;
    logs.push('❌ Fehler: ' + JSON.stringify(msg));
    console.error('Upload-Fehler:', msg);
    res.status(500).render('upload-result', { success: false, logs });
  }
});

module.exports = router;
