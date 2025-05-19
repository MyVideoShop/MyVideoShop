const path = require('path');
const fs = require('fs');
const mime = require('mime-types');
const B2 = require('backblaze-b2');

const b2 = new B2({
    applicationKeyId: process.env.B2_KEY_ID,
    applicationKey: process.env.B2_APP_KEY
});

let authorized = false;
let uploadUrl = null;
let uploadAuthToken = null;

async function authorizeIfNeeded() {
    if (!authorized) {
        await b2.authorize();
        authorized = true;
    }
}

async function ensureB2FolderExists(folderPath) {
    await authorizeIfNeeded();
    // B2 arbeitet mit "fake" Ordnern – einfach ignorieren, die Datei mit Pfad wird hochgeladen und der Ordner existiert dann implizit
    return true;
}

async function uploadToB2(localPath, b2Path) {
    await authorizeIfNeeded();

    const fileData = fs.readFileSync(localPath);
    const mimeType = mime.lookup(localPath) || 'application/octet-stream';

    const bucketId = process.env.B2_BUCKET_ID;

    const { data: uploadUrlData } = await b2.getUploadUrl({ bucketId });
    uploadUrl = uploadUrlData.uploadUrl;
    uploadAuthToken = uploadUrlData.authorizationToken;

    await b2.uploadFile({
        uploadUrl,
        uploadAuthToken,
        fileName: b2Path,
        data: fileData,
        contentType: mimeType
    });
}

module.exports = {
    uploadToB2,
    ensureB2FolderExists
};
