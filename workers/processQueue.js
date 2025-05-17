// workers/processQueue.js
const path = require('path');
const fs = require('fs');
const { connectToBackblaze, uploadFileToB2 } = require('../utils/b2');
const client = require('../utils/mongoClient');

(async () => {
  const logs = [];
  const db = client.db();
  const queue = db.collection('videoQueue');
  const processed = db.collection('videos');

  try {
    const pendingVideo = await queue.findOne({ status: 'pending' });

    if (!pendingVideo) {
      console.log('⏳ Keine Videos in der Warteschlange.');
      return;
    }

    const filePath = pendingVideo.filepath;
    const fileName = path.basename(filePath);

    logs.push(`🛠️ Verarbeitung gestartet für: ${fileName}`);

    // Upload zu Backblaze
    const fileUrl = await uploadFileToB2(filePath, fileName, logs);

    // In Videos-Collection speichern
    await processed.insertOne({
      title: pendingVideo.title,
      description: pendingVideo.description,
      categories: pendingVideo.categories,
      originalFilename: fileName,
      status: 'done',
      url: fileUrl,
      createdAt: new Date()
    });

    // Warteschlange aktualisieren
    await queue.deleteOne({ _id: pendingVideo._id });

    // Datei lokal löschen (optional)
    fs.unlinkSync(filePath);

    logs.push('✅ Video erfolgreich verarbeitet & entfernt aus Warteschlange.');

  } catch (err) {
    logs.push('❌ Fehler während der Verarbeitung: ' + err.message);
    console.error(logs.join('\n'));
  }

  console.log(logs.join('\n'));
})();
