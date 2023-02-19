const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');
const { sendEmailVerificationLink, sendResetPswdLink } = require('../emails/email');
const { createVerificationToken } = require('../utils/token');

// Request validation
const requestValidation = async (req) => {
  const errors = await validationResult(req);
  let message;
  if (!errors.isEmpty()) {
    message = `${errors.array()[0].param} ${errors.array()[0].msg}`;
  }
  return message;
};

// User signup
exports.register = async (req, res) => {
  try {
    // Request validation
    const result = await requestValidation(req);
    if (result) {
      return res.status(422).json({
        error: result
      });
    }

    const {
      firstName, lastName, email, password
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        error: 'User already exists'
      });
    }

    const user = new User({
      firstName,
      lastName,
      email,
      password,
      token: createVerificationToken()
    });
    const newUser = await user.save();

    if (!newUser) {
      return res.status(400).json({
        error: 'Signup failed. Please try again'
      });
    }

    // Send email verification link
    sendEmailVerificationLink(newUser);

    return res.status(200).json({
      message: 'Signup success',
      user: newUser.userDetails()
    });
  } catch (error) {
    console.log(error);
  }
};

// Verify email
exports.verifyEmail = (req, res) => {
  try {
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
          { $set: { isVerified: true } },
          { new: true }
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
  } catch (error) {
    console.log(error);
  }
};

// User signin
exports.login = async (req, res) => {
  try {
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

    if (!user.isVerified) {
      return res.status(400).json({
        error: 'Please verify your account.',
      });
    }

    if (!user.autheticate(password)) {
      return res.status(401).json({
        error: 'Invalid password',
      });
    }

    const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET, {
      expiresIn: process.env.TOKEN_EXPIRY,
    });
    const authUser = user.userDetails();
    return res.json({ token, authUser });
  } catch (error) {
    console.log(error);
  }
};

// Send reset password link
exports.sendResetPswdLink = async (req, res) => {
  try {
    const result = requestValidation(req);
    if (result) {
      return res.status(422).json({
        error: result,
      });
    }

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        error: 'Invalid email',
      });
    }

    // Send reset password link
    sendResetPswdLink(user);

    return res.status(200).json({
      message: 'An email with password reset link has been sent.',
    });
  } catch (error) {
    console.log(error);
  }
};

// Update password
exports.updatePassword = async (req, res) => {
  try {
    const result = await requestValidation(req);
    if (result) {
      return res.status(422).json({
        error: result
      });
    }

    const { token } = req.query;
    if (token) {
      jwt.verify(token, process.env.TOKEN_SECRET, async (err, decodedToken) => {
        if (err) {
          return res.status(400).json({
            error: 'Reset password link expired.',
          });
        }

        const user = await User.findOne({ email: decodedToken.email });
        user.password = req.body.new_password;

        const updated = await user.save();
        if (!updated) {
          return res.status(400).json({
            error: 'Cannot update password, please try again',
          });
        }
        return res.status(200).json({
          message: 'Password updated successfully',
        });
      });
    }
  } catch (error) {
    console.log(error);
  }
};
