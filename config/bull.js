const Queue = require('bull')

// Initiating the Queue with a redis instance
const sendMailQueue = new Queue('sendMail', process.env.REDIS_URL)
const deletePackageQueue = new Queue('deletePackage', process.env.REDIS_URL)

module.exports = {
  sendMailQueue,
  deletePackageQueue
}
