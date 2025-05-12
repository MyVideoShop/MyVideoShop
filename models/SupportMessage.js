// models/SupportMessage.js
const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema({
  title: String,
  description: String,
  createdAt: Date
});

module.exports = mongoose.model('SupportMessage', supportMessageSchema);
