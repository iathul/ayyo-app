const { sendMailQueue } = require('../config/bull')
const transporter = require('../config/nodemailer')

// Consumer: this gets called each time the producer receives a new email.
exports.sendEmailJob = async () => {
  sendMailQueue.process(async (job) => {
    await transporter.sendMail(job.data.mailOptions, (error, info) => {
      if (error) {
        console.log(error.message)
      }
      if (info) {
        console.log(`${job.data.response}: ${info.response}`)
      }
    })
  })
}
