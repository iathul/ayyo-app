const { sendEmailJob } = require('./jobs/sendEmails');
const { deletePackageJob } = require('./jobs/deletePackage');

const runJobs = async () => {
  await sendEmailJob();
  await deletePackageJob();
};

module.exports = runJobs;
