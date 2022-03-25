const mongoose = require('mongoose');
const moment = require('moment');

const { ObjectId } = mongoose.Schema;

const file = {
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
  metadata: {
    type: Object,
  },
  originalname: {
    type: String,
  },
  size: {
    type: Number,
  },
};

const packageSchema = new mongoose.Schema(
  {
    user: {
      type: ObjectId,
      ref: 'User',
    },
    packageId: {
      type: String,
      unique: true,
    },
    files: [file],
    status: {
      type: String,
      enum: ['created', 'downloaded'],
      default: 'created',
    },
    package_expiry_date: {
      type: Date,
    },
    package_destination: {
      type: String,
    },
    package_download_count: {
      type: Number,
      default: 0,
    },
    package_last_download_at: {
      type: Date,
    }
  },
  { timestamps: true }
);

packageSchema.methods = {
  async updatePackageStatus(packageId) {
    const Package = mongoose.model('Package');
    const packageData = await Package.findOne({ packageId });
    packageData.status = 'downloaded';
    packageData.package_download_count += 1;
    packageData.package_last_download_at = moment();
    await packageData.save();
  }
};

module.exports = mongoose.model('Package', packageSchema);
