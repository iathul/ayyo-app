const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/user');

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
  return res.status(200).json({
    message: 'Signup success',
  });
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

  const token = jwt.sign(
    // eslint-disable-next-line no-underscore-dangle
    { _id: user._id },
    process.env.TOKEN_SECRET,

    { expiresIn: '7d' },
  );

  const authUser = user.userData();

  return res.json({ token, authUser });
};
