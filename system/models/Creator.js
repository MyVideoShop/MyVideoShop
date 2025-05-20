const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const creatorSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  bio: { type: String, maxlength: 500 },
  profileImage: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'active', 'suspended', 'rejected'], 
    default: 'pending' 
  },
  earnings: { type: Number, default: 0 },
  videos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Video' }],
  coupons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' }],
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  application: {
    appliedAt: { type: Date, default: Date.now },
    description: String,
    status: { 
      type: String, 
      enum: ['pending', 'approved', 'rejected'], 
      default: 'pending' 
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    reviewedAt: Date,
    feedback: String
  }
});

// Passwort hashen vor dem Speichern
creatorSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Passwortvergleichsmethode
creatorSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Creator', creatorSchema);
