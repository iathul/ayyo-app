const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema;

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
    files: {
      type: Array,
      default: [],
    },
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
    await packageData.save();
  }
};

module.exports = mongoose.model('Package', packageSchema);
