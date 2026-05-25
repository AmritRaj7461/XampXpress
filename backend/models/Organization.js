const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, { timestamps: true });

module.exports = mongoose.model('Organization', organizationSchema);
