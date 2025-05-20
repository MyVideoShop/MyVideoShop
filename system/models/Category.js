const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, maxlength: 200 },
  videoCount: { type: Number, default: 0 },
  purchaseCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Indexes
categorySchema.index({ name: 1 });
categorySchema.index({ slug: 1 });
categorySchema.index({ videoCount: -1 });
categorySchema.index({ purchaseCount: -1 });

module.exports = mongoose.model('Category', categorySchema);
