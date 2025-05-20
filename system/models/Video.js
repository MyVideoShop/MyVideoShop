const mongoose = require('mongoose');

const videoSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  description: { type: String, maxlength: 500 },
  price: { type: Number, default: 0 },
  isFree: { type: Boolean, default: false },
  categories: [{ type: String }],
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator' },
  uploadDate: { type: Date, default: Date.now },
  views: { type: Number, default: 0 },
  purchases: { type: Number, default: 0 },
  earnings: { type: Number, default: 0 },
  status: { 
    type: String, 
    enum: ['processing', 'published', 'unpublished', 'deleted'], 
    default: 'processing' 
  },
  thumbnailUrl: { type: String },
  previewUrl: { type: String },
  videoUrl: { type: String },
  duration: { type: Number }, // in Sekunden
  size: { type: Number }, // in Bytes
  resolution: { type: String },
  format: { type: String },
  b2FileId: { type: String },
  b2BucketId: { type: String },
  metadata: { type: Object }
});

// Indexes für bessere Suchleistung
videoSchema.index({ title: 'text', description: 'text' });
videoSchema.index({ creator: 1 });
videoSchema.index({ categories: 1 });
videoSchema.index({ uploadDate: -1 });
videoSchema.index({ purchases: -1 });
videoSchema.index({ earnings: -1 });

module.exports = mongoose.model('Video', videoSchema);
