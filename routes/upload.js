const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
require('dotenv').config();

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
    // Schritt 1: Video komprimieren
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

    // Schritt 2: Datei vorbereiten
    logs.push('📦 Datei wird geladen und gehasht...');
    const fileBuffer = fs.readFileSync(outputPath);
    const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');

    // Schritt 3: B2 Autorisierung
    logs.push('🔐 Authentifiziere bei B2...');
    const b2Auth = Buffer.from(`${process.env.B2_ACCOUNT_ID}:${process.env.B2_APP_KEY}`).toString('base64');
    const authRes = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: { Authorization: `Basic ${b2Auth}` },
    });
    const { authorizationToken, apiUrl, downloadUrl } = authRes.data;
    logs.push('✅ Autorisierung erfolgreich.');

    // Schritt 4: Upload-URL holen
    logs.push('🌐 Hole Upload-URL...');
    const uploadUrlRes = await axios.post(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      bucketId: process.env.B2_BUCKET_ID,
    }, {
      headers: { Authorization: authorizationToken },
    });
    const { uploadUrl, authorizationToken: uploadAuthToken } = uploadUrlRes.data;
    logs.push('✅ Upload-URL erhalten.');

    // Schritt 5: Datei hochladen
    logs.push('📤 Lade Datei zu Backblaze B2 hoch...');
    await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: uploadAuthToken,
        'X-Bz-File-Name': encodeURIComponent(outputFilename),
        'Content-Type': 'b2/x-auto',
        'Content-Length': fileBuffer.length,
        'X-Bz-Content-Sha1': sha1,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });
    logs.push('✅ Datei erfolgreich hochgeladen.');

    const publicUrl = `${downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${encodeURIComponent(outputFilename)}`;
    logs.push('🔗 Öffentliche URL: ' + publicUrl);

    // Aufräumen
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
