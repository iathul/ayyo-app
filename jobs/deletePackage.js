const schedule = require('node-schedule');
const { deletePackageQueue } = require('../config/bull');
const Package = require('../models/package');
const s3 = require('../config/S3Config');

exports.deletePackageJob = async () => {
  schedule.scheduleJob('*/10 * * * *', async () => {
    const packageModel = new Package();
    const packages = await packageModel.getExpiredPackages();
    if (packages.length > 0) {
      packages.map(async (data) => {
        const jobData = {
          packageId: data.packageId,
          files: data.files,
        };
        await deletePackageQueue.add(jobData);
      });
      deletePackageQueue.process(async (job) => {
        const { packageId, files } = job.data;
        const deletePromises = files.map((file) => {
          const params = {
            Bucket: 'ayyo-file-storage',
            Key: `${file.metadata.fieldName}/${file.originalname}`,
          };
          return s3.deleteObject(params).promise();
        });
        await Promise.all(deletePromises);
        await packageModel.deletePackageById(packageId);
        console.log('Package deleted');
      });
    } else {
      console.log('No expired packages');
    }
  });
};
