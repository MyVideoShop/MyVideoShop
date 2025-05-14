const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const axios = require('axios');
const FormData = require('form-data');
const path = require('path');

// Deinen Pixeldrain-API-Key hier einfügen
const PIXELDRAIN_API_KEY = 'DEIN_PIXELDRAIN_API_KEY_HIER';

async function processAndUploadVideo(filePath) {
  return new Promise((resolve, reject) => {
    const tempPath = filePath.replace(/\.(\w+)$/, '-processed.mp4');

    // Metadaten entfernen + Komprimieren
    ffmpeg(filePath)
      .outputOptions([
        '-vf scale=-1:1080', // Höhe auf 1080px, Breite automatisch
        '-map_metadata -1',  // Metadaten entfernen
        '-c:v libx264',      // Standard-Codec
        '-crf 23',           // Qualitätsstufe (niedriger = besser)
        '-preset medium'
      ])
      .on('end', async () => {
        // Upload zu Pixeldrain
        try {
          const form = new FormData();
          form.append('file', fs.createReadStream(tempPath));
          const uploadRes = await axios.post('https://pixeldrain.com/api/file', form, {
            headers: {
              ...form.getHeaders(),
              Authorization: `Bearer ${PIXELDRAIN_API_KEY}`
            }
          });

          fs.unlinkSync(filePath);
          fs.unlinkSync(tempPath);

          const fileId = uploadRes.data?.id;
          if (!fileId) return reject(new Error('Kein Pixeldrain-Link erhalten'));

          // Rückgabe: eingebettete Player-URL
          resolve(`https://pixeldrain.com/api/file/${fileId}`);
        } catch (err) {
          reject(err);
        }
      })
      .on('error', err => reject(err))
      .save(tempPath);
  });
}

module.exports = { processAndUploadVideo };
