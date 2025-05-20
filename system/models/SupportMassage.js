const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 100 },
  message: { type: String, required: true, maxlength: 1000 },
  sender: { 
    type: String, 
    enum: ['customer', 'creator', 'admin'], 
    required: true 
  },
  senderId: { type: mongoose.Schema.Types.ObjectId },
  senderEmail: { type: String },
  status: { 
    type: String, 
    enum: ['open', 'in_progress', 'resolved', 'closed'], 
    default: 'open' 
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  responses: [{
    responder: { 
      type: String, 
      enum: ['customer', 'creator', 'admin'], 
      required: true 
    },
    responderId: { type: mongoose.Schema.Types.ObjectId },
    message: { type: String, required: true, maxlength: 1000 },
    createdAt: { type: Date, default: Date.now }
  }],
  isCreatorSupport: { type: Boolean, default: false }
});

// Indexes
supportMessageSchema.index({ sender: 1 });
supportMessageSchema.index({ senderId: 1 });
supportMessageSchema.index({ status: 1 });
supportMessageSchema.index({ createdAt: -1 });
supportMessageSchema.index({ isCreatorSupport: 1 });

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
