const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
    originalName: String,
    b2Path: String,
    uploadDate: Date,
    status: { type: String, default: 'pending' }
});

module.exports = mongoose.model('Video', videoSchema);
