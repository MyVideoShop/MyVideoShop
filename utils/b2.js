async function uploadFileToB2(localFilePath, remoteFileName, logs = []) {
  try {
    logs.push("🚀 Starte Upload zu Backblaze...");

    await connectToBackblaze();

    logs.push("🔍 Lese Datei: " + localFilePath);
    if (!fs.existsSync(localFilePath)) {
      throw new Error("Datei nicht gefunden: " + localFilePath);
    }

    const bucketName = process.env.B2_BUCKET_NAME;
    logs.push("📦 Lade Bucket-Info für: " + bucketName);
    const bucketResponse = await b2.getBucket({ bucketName });
    const bucketId = bucketResponse.data.buckets[0]?.bucketId;

    if (!bucketId) {
      throw new Error("❌ Kein Bucket gefunden mit dem Namen: " + bucketName);
    }

    const fileData = fs.readFileSync(localFilePath);
    const stats = fs.statSync(localFilePath);
    const contentType = 'video/mp4';

    logs.push("🌐 Hole Upload-URL...");
    const uploadUrlResponse = await b2.getUploadUrl({ bucketId });

    logs.push("📤 Starte Datei-Upload...");
    const uploadResponse = await b2.uploadFile({
      uploadUrl: uploadUrlResponse.data.uploadUrl,
      uploadAuthToken: uploadUrlResponse.data.authorizationToken,
      fileName: `Videos/${remoteFileName}`,
      data: fileData,
      contentLength: stats.size,
      contentType
    });

    const fileUrl = `https://f000.backblazeb2.com/file/${bucketName}/Videos/${remoteFileName}`;
    logs.push(`✅ Video erfolgreich hochgeladen: ${fileUrl}`);

    return fileUrl;

  } catch (err) {
    logs.push("❌ Fehler beim Hochladen zu Backblaze: " + err.message);
    console.error("❌ Backblaze Upload Error:", err.stack);
    throw err;
  }
}
