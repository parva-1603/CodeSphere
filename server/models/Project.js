const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  language: {
    type: String,
    required: true,
    default: 'javascript'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  lastContent: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
