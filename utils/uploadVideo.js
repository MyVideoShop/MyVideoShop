// utils/uploadVideo.js
const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');

const b2 = new AWS.S3({
  endpoint: new AWS.Endpoint(`https://s3.${process.env.B2_BUCKET_REGION}.backblazeb2.com`),
  accessKeyId: process.env.B2_KEY_ID,
  secretAccessKey: process.env.B2_APPLICATION_KEY,
  region: process.env.B2_BUCKET_REGION,
  signatureVersion: 'v4',
});

async function uploadVideoToB2(localFilePath, remoteFilename) {
  const fileStream = fs.createReadStream(localFilePath);
  const params = {
    Bucket: process.env.B2_BUCKET_NAME,
    Key: `uploads/${remoteFilename}`, // z. B. uploads/video123.mp4
    Body: fileStream,
    ContentType: 'video/mp4',
    ACL: 'private', // oder 'public-read' falls öffentlich
  };

  return new Promise((resolve, reject) => {
    b2.upload(params, (err, data) => {
      if (err) {
        console.error('Fehler beim Upload zu B2:', err);
        return reject(err);
      }
      console.log('Upload erfolgreich:', data.Location);
      resolve(data.Location);
    });
  });
}

module.exports = uploadVideoToB2;
