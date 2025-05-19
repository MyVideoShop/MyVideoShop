const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadToB2, ensureB2FolderExists } = require('../b2');
const Video = require('../models/Video');

const upload = multer({ dest: 'temp_uploads/' });

router.get('/admin/upload', (req, res) => {
    res.render('admin_upload');
});

router.post('/admin/upload', upload.single('video'), async (req, res) => {
    const file = req.file;
    const folder = req.body.folder || 'Videos';
    const filename = file.originalname;

    if (!file) {
        console.error('[UPLOAD] Kein Video erhalten.');
        return res.status(400).send('Kein Video hochgeladen.');
    }

    const filePath = path.join(file.destination, file.filename);

    try {
        console.log(`[UPLOAD] Starte Upload für Datei "${filename}" in Ordner "${folder}"`);

        // Ordnerpfad in B2 prüfen/erstellen
        await ensureB2FolderExists(folder);

        // Datei in B2 hochladen
        const b2Path = `${folder}/${filename}`;
        await uploadToB2(filePath, b2Path);

        // Metadaten in MongoDB speichern
        const newVideo = new Video({
            originalName: filename,
            b2Path: b2Path,
            uploadDate: new Date(),
            status: 'pending'
        });

        await newVideo.save();

        console.log(`[UPLOAD] Erfolgreich: ${filename} in B2 (${b2Path}) + MongoDB`);

        fs.unlinkSync(filePath); // temporäre Datei löschen
        res.send('Upload erfolgreich!');
    } catch (err) {
        console.error('[UPLOAD] FEHLER beim Hochladen:', {
            step: 'Upload',
            error: err.message,
            stack: err.stack
        });

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.status(500).send('Fehler beim Hochladen.');
    }
});

module.exports = router;
