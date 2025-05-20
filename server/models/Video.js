const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const videoSchema = new mongoose.Schema({
  videoId: {
    type: String,
    default: uuidv4,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    minlength: 10,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  isFree: {
    type: Boolean,
    default: false
  },
  categories: [{
    type: String,
    required: true
  }],
  b2VideoPath: {
    type: String,
    required: true
  },
  b2ThumbnailPath: {
    type: String
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Creator'
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
  purchaseCount: {
    type: Number,
    default: 0
  },
  pixelDrainUrl: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'published', 'rejected'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes für schnelle Suche
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ categories: 1 });
videoSchema.index({ creatorId: 1 });
videoSchema.index({ status: 1 });

const Video = mongoose.model('Video', videoSchema);

module.exports = Video;
