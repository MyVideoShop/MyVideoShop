// utils/b2.js
const B2 = require('backblaze-b2');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

async function connectToBackblaze() {
  try {
    await b2.authorize();
    console.log('✅ Mit Backblaze B2 verbunden.');
  } catch (error) {
    console.error('❌ Fehler beim Verbinden mit Backblaze B2:', error.message);
    throw error;
  }
}

async function uploadFileToB2(localFilePath, remoteFileName, logs = []) {
  try {
    await connectToBackblaze();

    const bucketName = process.env.B2_BUCKET_NAME;
    const bucketResponse = await b2.getBucket({ bucketName });
    const bucketId = bucketResponse.data.buckets[0].bucketId;

    const fileData = fs.readFileSync(localFilePath);
    const stats = fs.statSync(localFilePath);
    const contentType = 'video/mp4'; // oder dynamisch setzen, wenn nötig

    const uploadUrlResponse = await b2.getUploadUrl({ bucketId });

    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: `Videos/${remoteFileName}`, // in Unterordner "Videos/"
      data: fileData,
      contentLength: stats.size,
      contentType
    });

    const fileUrl = `https://f000.backblazeb2.com/file/${bucketName}/Videos/${remoteFileName}`;
    logs.push(`✅ Hochgeladen zu B2: ${fileUrl}`);
    return fileUrl;
  } catch (error) {
    logs.push(`❌ Fehler beim Upload zu B2: ${error.message}`);
    throw error;
  }
}

module.exports = { b2, connectToBackblaze, uploadFileToB2 };
