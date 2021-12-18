const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const fileSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: 'User',
  },
  transferId: {
    type: String,
  },
  destination: {
    type: String,
  },
  encoding: {
    type: String,
  },
  fieldname: {
    type: String,
  },
  filename: {
    type: String,
  },
  mimetype: {
    type: String,
  },
  originalname: {
    type: String,
  },
  path: {
    type: String,
  },
  size: {
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('File', fileSchema);
