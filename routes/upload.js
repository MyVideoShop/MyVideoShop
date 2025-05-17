const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

// Multer Konfiguration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'temp/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Video-Upload-Route
router.post('/upload', upload.single('video'), async (req, res) => {
  const inputPath = req.file.path;
  const outputFilename = 'compressed-' + req.file.filename;
  const outputPath = path.join('temp', outputFilename);

  try {
    // Schritt 1: Video komprimieren
    await new Promise((resolve, reject) => {
      ffmpeg(inputPath)
        .outputOptions([
          '-vcodec libx264',
          '-crf 28',
          '-preset veryfast',
          '-acodec aac',
          '-b:a 128k',
        ])
        .on('end', resolve)
        .on('error', reject)
        .save(outputPath);
    });

    // Schritt 2: Datei lesen
    const fileBuffer = fs.readFileSync(outputPath);
    const sha1 = crypto.createHash('sha1').update(fileBuffer).digest('hex');
    const fileName = outputFilename;

    // Schritt 3: Authentifizieren bei Backblaze B2
    const b2Auth = Buffer.from(`${process.env.B2_ACCOUNT_ID}:${process.env.B2_APP_KEY}`).toString('base64');
    const authRes = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
      headers: {
        Authorization: `Basic ${b2Auth}`,
      },
    });

    const { authorizationToken, apiUrl, downloadUrl } = authRes.data;

    // Schritt 4: Upload-URL holen
    const uploadUrlRes = await axios.post(`${apiUrl}/b2api/v2/b2_get_upload_url`, {
      bucketId: process.env.B2_BUCKET_ID,
    }, {
      headers: {
        Authorization: authorizationToken,
      },
    });

    const { uploadUrl, authorizationToken: uploadAuthToken } = uploadUrlRes.data;

    // Schritt 5: Datei hochladen
    await axios.post(uploadUrl, fileBuffer, {
      headers: {
        Authorization: uploadAuthToken,
        'X-Bz-File-Name': encodeURIComponent(fileName),
        'Content-Type': 'b2/x-auto',
        'Content-Length': fileBuffer.length,
        'X-Bz-Content-Sha1': sha1,
      },
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
    });

    // Schritt 6: Öffentliche URL erzeugen
    const publicUrl = `${downloadUrl}/file/${process.env.B2_BUCKET_NAME}/${encodeURIComponent(fileName)}`;

    // Aufräumen
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.json({ success: true, url: publicUrl });
  } catch (error) {
    console.error('Fehler beim Hochladen:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Upload fehlgeschlagen' });
  }
});

module.exports = router;
