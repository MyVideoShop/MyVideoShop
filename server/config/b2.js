const B2 = require('backblaze-b2');
const path = require('path');
const fs = require('fs');
const mime = require('mime-types');

const b2 = new B2({
  applicationKeyId: process.env.B2_KEY_ID,
  applicationKey: process.env.B2_APPLICATION_KEY
});

let authorized = false;

async function authorize() {
  if (!authorized) {
    await b2.authorize();
    authorized = true;
  }
}

async function uploadFile(filePath, fileName, folder = '') {
  await authorize();
  
  const fileData = fs.readFileSync(filePath);
  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
  const finalFileName = folder ? `${folder}/${fileName}` : fileName;

  const { data: uploadUrlData } = await b2.getUploadUrl({
    bucketId: process.env.B2_BUCKET_ID
  });

  const response = await b2.uploadFile({
    uploadUrl: uploadUrlData.uploadUrl,
    uploadAuthToken: uploadUrlData.authorizationToken,
    fileName: finalFileName,
    data: fileData,
    contentType: mimeType
  });

  return response.data;
}

async function getFileUrl(fileName) {
  await authorize();
  const response = await b2.getDownloadUrl({
    bucketName: process.env.B2_BUCKET_NAME,
    fileName: fileName
  });
  return response.data;
}

module.exports = {
  uploadFile,
  getFileUrl
};
