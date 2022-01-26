const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

const packageSchema = new mongoose.Schema({
  user: {
    type: ObjectId,
    ref: 'User',
  },
  packageId: {
    type: String,
    unique: true,
  },
  files: {
    type: Array,
    default: [],
  },
}, { timestamps: true });

packageSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: process.env.PACKAGE_EXPIRY },
);

module.exports = mongoose.model('Package', packageSchema);
