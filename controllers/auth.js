/* eslint-disable no-console */
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const { sendEmailVerificationLink } = require('./email');

// Request validation
const requestValidation = (req) => {
  const errors = validationResult(req);
  let message;
  if (!errors.isEmpty()) {
    message = `${errors.array()[0].param} ${errors.array()[0].msg}`;
  }
  return message;
};

// User signup
exports.register = async (req, res) => {
  // Request validation
  const result = requestValidation(req);
  if (result) {
    return res.status(422).json({
      error: result,
    });
  }

  const userExists = await User.findOne({ email: req.body.email });
  if (userExists) {
    return res.status(400).json({
      error: 'User already exists',
    });
  }

  const user = new User(req.body);
  const newUser = await user.save();

  if (!newUser) {
    return res.status(400).json({
      error: 'Signup failed. Please try again',
    });
  }

  // Todo email queue
  try {
    sendEmailVerificationLink(newUser);
  } catch (error) {
    console.log(error);
  }

  return res.status(200).json({
    message: 'Signup success',
  });
};

exports.verifyEmail = (req, res) => {
  const { token } = req.params;
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
      if (err) {
        return res.status(400).json({
          error: 'Activation link expired.',
        });
      }

      const verified = await User.findOneAndUpdate(
        { email: decodedToken.email },
        { $set: { isEmailVerified: true, isVerified: true } },
        { new: true },
      );

      if (!verified) {
        return res.status(400).json({
          error: 'Something Went Wrong, Please Try Again',
        });
      }

      return res.status(200).json({
        message: 'Email verified successfully',
      });
    });
  }
};

// User signin
exports.login = async (req, res) => {
  // Request validation
  const result = requestValidation(req);
  if (result) {
    return res.status(422).json({
      error: result,
    });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    return res.status(400).json({
      error: 'User not found. Please signup',
    });
  }

  if (!user.autheticate(password)) {
    return res.status(401).json({
      error: 'Invalid password',
    });
  }

  // eslint-disable-next-line no-underscore-dangle
  const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, { expiresIn: '7d' });
  const authUser = user.userDetails();
  return res.json({ token, authUser });
};
