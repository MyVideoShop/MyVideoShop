const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  value: { type: Number, required: true }, // Betrag oder Prozentsatz
  isPercentage: { type: Boolean, default: false },
  remainingValue: { type: Number, required: true },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator' },
  isGlobal: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
  usedBy: [{
    userId: { type: mongoose.Schema.Types.ObjectId },
    videoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
    usedAt: { type: Date, default: Date.now },
    amountUsed: { type: Number }
  }],
  maxUses: { type: Number },
  currentUses: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
});

// Indexes
couponSchema.index({ code: 1 });
couponSchema.index({ creator: 1 });
couponSchema.index({ isGlobal: 1 });
couponSchema.index({ isActive: 1 });
couponSchema.index({ expiresAt: 1 });

module.exports = mongoose.model('Coupon', couponSchema);
