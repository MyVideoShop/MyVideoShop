// utils/videoProcessor.js

const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const axios = require('axios');
const FormData = require('form-data');

// === DEIN API-KEY HIER EINFÜGEN ===
const PIXELDRAIN_API_KEY = 'HIER_DEIN_API_KEY_EINFÜGEN';

function removeMetadataAndCompress(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .outputOptions([
        '-vf', 'scale=-2:1080',       // max Höhe 1080p
        '-c:v', 'libx264',
        '-preset', 'slow',
        '-crf', '23',
        '-c:a', 'copy',
        '-map_metadata', '-1'         // entfernt Metadaten
      ])
      .save(outputPath)
      .on('end', resolve)
      .on('error', reject);
  });
}

async function uploadToPixeldrain(filePath) {
  const form = new FormData();
  form.append('file', fs.createReadStream(filePath));

  const response = await axios.post('https://pixeldrain.com/api/file', form, {
    headers: {
      ...form.getHeaders(),
      Authorization: `Bearer ${PIXELDRAIN_API_KEY}`
    }
  });

  if (response.data && response.data.success) {
    return `https://pixeldrain.com/u/${response.data.id}`;
  } else {
    throw new Error('Upload zu Pixeldrain fehlgeschlagen.');
  }
}

async function processAndUploadVideo(inputPath) {
  const outputPath = inputPath.replace(/(\.\w+)$/, '_processed$1');
  await removeMetadataAndCompress(inputPath, outputPath);
  const pixeldrainUrl = await uploadToPixeldrain(outputPath);

  fs.unlinkSync(inputPath);       // Original löschen
  fs.unlinkSync(outputPath);      // Komprimierte Datei löschen

  return pixeldrainUrl;
}

module.exports = { processAndUploadVideo };
