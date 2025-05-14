const { processAndUploadVideo } = require('./videoProcessor');
const fs = require('fs');
const path = require('path');

const queue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || queue.length === 0) return;
  isProcessing = true;

  const { filePath, metadata } = queue.shift();

  try {
    const pixeldrainLink = await processAndUploadVideo(filePath);
    const videoDataFile = path.join(__dirname, '../data/videos.json');
    const videos = fs.existsSync(videoDataFile) ? JSON.parse(fs.readFileSync(videoDataFile)) : [];

    videos.unshift({
      id: Date.now(),
      title: metadata.title,
      description: metadata.description,
      categories: metadata.categories,
      url: pixeldrainLink,
      date: new Date().toISOString()
    });

    fs.writeFileSync(videoDataFile, JSON.stringify(videos, null, 2));
  } catch (err) {
    console.error('Fehler beim Verarbeiten aus Warteschlange:', err);
  } finally {
    isProcessing = false;
    processQueue(); // nächstes Video verarbeiten
  }
};

const addToQueue = (filePath, metadata) => {
  queue.push({ filePath, metadata });
  processQueue();
};

module.exports = { addToQueue };
