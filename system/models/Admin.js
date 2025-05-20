const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  permissions: {
    stats: { type: Boolean, default: false },
    videoUpload: { type: Boolean, default: false },
    videoManage: { type: Boolean, default: false },
    couponCreate: { type: Boolean, default: false },
    couponManage: { type: Boolean, default: false },
    creatorCreate: { type: Boolean, default: false },
    creatorManage: { type: Boolean, default: false },
    adminCreate: { type: Boolean, default: false },
    adminManage: { type: Boolean, default: false },
    support: { type: Boolean, default: false }
  },
  createdAt: { type: Date, default: Date.now },
  lastLogin: Date,
  activityLog: [{
    action: String,
    timestamp: { type: Date, default: Date.now },
    details: Object
  }]
});

// Passwort hashen vor dem Speichern
adminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Passwortvergleichsmethode
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Admin', adminSchema);
