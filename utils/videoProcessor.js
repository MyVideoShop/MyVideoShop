const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Zielverzeichnis für komprimierte Videos
const processedFolder = path.join(__dirname, '../processed');
if (!fs.existsSync(processedFolder)) fs.mkdirSync(processedFolder);

function processVideo(inputPath) {
  return new Promise((resolve, reject) => {
    const filename = path.basename(inputPath, path.extname(inputPath)) + '_processed.mp4';
    const outputPath = path.join(processedFolder, filename);

    const ffmpegCommand = `ffmpeg -i "${inputPath}" -map_metadata -1 -c:v libx264 -crf 23 -preset fast -vf "scale='min(1920,iw)':'-2'" -c:a aac -b:a 128k "${outputPath}"`;

    exec(ffmpegCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('FFmpeg Fehler:', error);
        return reject(error);
      }

      console.log('FFmpeg erfolgreich:', outputPath);
      resolve(outputPath);
    });
  });
}

module.exports = { processVideo };
