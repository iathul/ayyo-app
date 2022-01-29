const ejs = require('ejs');
const path = require('path');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');
const sendMailQueue = require('../config/bull');

// Template base path
const template = path.join(process.cwd(), '/views/emails');

// Bull producer options
const options = {
  attempts: 2,
};

// Send email verification link
exports.sendEmailVerificationLink = async (user) => {
  try {
    const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, {
      expiresIn: '10m',
    });

    const url = `${
      process.env.NODE_ENV === 'development'
        ? process.env.BASE_URL
        : process.env.BASE_URL_PROD
    }/api/auth/verify/email/${token}`;

    const mailData = await ejs.renderFile(`${template}/verifyAccount.ejs`, {
      name: user.fullName(),
      url,
    });

    if (!mailData) {
      console.log('Error rendering email template');
    }

    const mailOptions = {
      from: process.env.Email,
      to: user.email,
      subject: 'Confirm your email',
      html: mailData,
    };

    // Producer: adds jobs to que.
    sendMailQueue.add(mailOptions, options);

    // Consumer: this gets called each time the producer receives a new email.
    sendMailQueue.process(async (job) => {
      await transporter.sendMail(job.data, (error, info) => {
        if (error) {
          console.log(error.message);
        }
        if (info) {
          console.log(
            `Email verification email has been sent: ${info.response}`
          );
        }
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};

// Send reset password link
exports.sendResetPswdLink = async (user) => {
  try {
    const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, {
      expiresIn: '10m',
    });

    const url = `${
      process.env.NODE_ENV === 'development'
        ? process.env.BASE_URL
        : process.env.BASE_URL_PROD
    }/api/auth/password/update/${token}`;

    const mailData = await ejs.renderFile(`${template}/resetPswd.ejs`, {
      name: user.fullName(),
      url,
    });

    if (!mailData) {
      console.log('Error rendering email template');
    }

    const mailOptions = {
      from: process.env.Email,
      to: user.email,
      subject: 'Reset Your Password',
      html: mailData,
    };

    // Producer: adds jobs to que.
    sendMailQueue.add(mailOptions, options);

    // Consumer: this gets called each time the producer receives a new email.
    sendMailQueue.process(async (job) => {
      await transporter.sendMail(job.data, (error, info) => {
        if (error) {
          console.log(error.message);
        }
        if (info) {
          console.log(`Reset password email has been sent: ${info.response}`);
        }
      });
    });
  } catch (error) {
    console.log(error.message);
  }
};
