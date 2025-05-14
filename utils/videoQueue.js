const fs = require('fs');
const path = require('path');
const { processAndUploadVideo } = require('./videoProcessor');

const videoDataFile = path.join(__dirname, '../data/videos.json');
const queue = [];

async function processQueue() {
  if (queue.processing || queue.length === 0) return;

  queue.processing = true;
  const task = queue.shift();

  try {
    const pixeldrainLink = await processAndUploadVideo(task.filePath);
    const videos = fs.existsSync(videoDataFile) ? JSON.parse(fs.readFileSync(videoDataFile)) : [];

    videos.unshift({
      id: task.id,
      title: task.title,
      description: task.description,
      categories: task.categories,
      url: pixeldrainLink,
      date: new Date().toISOString()
    });

    fs.writeFileSync(videoDataFile, JSON.stringify(videos, null, 2));
    console.log(`Video ${task.title} verarbeitet.`);
  } catch (err) {
    console.error('Fehler in der Warteschlange:', err);
  } finally {
    queue.processing = false;
    processQueue(); // nächstes Element verarbeiten
  }
}

setInterval(processQueue, 5000); // alle 5 Sek. prüfen

module.exports = queue;
