// utils/uploadVideos.js
const B2 = require('backblaze-b2');
const fs = require('fs');
const path = require('path');

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APP_KEY,
});

async function uploadVideo(filePath, fileName) {
  try {
    await b2.authorize();
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId: process.env.B2_BUCKET_ID });

    const fileData = fs.readFileSync(filePath);
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: fileName,
      data: fileData,
    });

    return uploadResponse.data.fileId;
  } catch (error) {
    console.error('Fehler beim Hochladen des Videos:', error);
    throw error;
  }
}

module.exports = { uploadVideo };
