const { sendEmailJob } = require('./jobs/sendEmails');

const runJobs = async () => {
  await sendEmailJob();
};

module.exports = runJobs;
