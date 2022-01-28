const ejs = require('ejs');
const path = require('path');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');

// Template base path
const template = path.join(process.cwd(), '/views/emails');

// Send email verification link
exports.sendEmailVerificationLink = (user) => {
  const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, { expiresIn: '10m' });

  const url = `${
    process.env.NODE_ENV === 'development'
      ? process.env.BASE_URL
      : process.env.BASE_URL_PROD
  }/api/auth/verify/email/${token}`;

  ejs.renderFile(`${template}/verifyAccount.ejs`, { name: user.fullName(), url }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      const mailOptions = {
        from: process.env.Email,
        to: user.email,
        subject: 'Confirm your email',
        html: data,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return error;
        }
        console.log(`Email verification email has been sent: ${info.response}`);
      });
    }
  });
};

// Send reset password link
exports.sendResetPswdLink = (user) => {
  const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, { expiresIn: '10m' });

  const url = `${
    process.env.NODE_ENV === 'development'
      ? process.env.BASE_URL
      : process.env.BASE_URL_PROD
  }/api/auth/password/update/${token}`;

  ejs.renderFile(`${template}/resetPswd.ejs`, { name: user.fullName(), url }, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      const mailOptions = {
        from: process.env.Email,
        to: user.email,
        subject: 'Reset Your Password',
        html: data,
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.log(error);
          return error;
        }
        console.log(`Reset password email has been sent: ${info.response}`);
      });
    }
  });
};
