const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  video: { type: mongoose.Schema.Types.ObjectId, ref: 'Video', required: true },
  buyerEmail: { type: String },
  amountPaid: { type: Number, required: true },
  currency: { type: String, default: 'EUR' },
  paymentMethod: { type: String, enum: ['paypal', 'credit_card', 'coupon'], required: true },
  paymentId: { type: String },
  coupon: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
  couponAmount: { type: Number },
  creatorEarnings: { type: Number },
  platformEarnings: { type: Number },
  purchaseDate: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['pending', 'completed', 'failed', 'refunded'], 
    default: 'pending' 
  },
  accessToken: { type: String, unique: true },
  accessExpires: Date
});

// Indexes
purchaseSchema.index({ video: 1 });
purchaseSchema.index({ buyerEmail: 1 });
purchaseSchema.index({ paymentId: 1 });
purchaseSchema.index({ purchaseDate: -1 });
purchaseSchema.index({ accessToken: 1 });
purchaseSchema.index({ accessExpires: 1 });

module.exports = mongoose.model('Purchase', purchaseSchema);
