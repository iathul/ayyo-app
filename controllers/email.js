/* eslint-disable consistent-return */
/* eslint-disable no-console */
const ejs = require('ejs');
const path = require('path');
const jwt = require('jsonwebtoken');
const transporter = require('../config/nodemailer');

// Import email template
const template = path.join(process.cwd(), '/views/emails');

exports.sendEmailVerificationLink = (user) => {
  const token = jwt.sign({ email: user.email }, process.env.TOKEN_SECRET, { expiresIn: '10m' });

  const url = `${process.env.BASE_URL}/api/auth/verify/email/${token}`;

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
