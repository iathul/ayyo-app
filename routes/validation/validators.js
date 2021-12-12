const { body } = require('express-validator');

exports.signupValidation = () => [
  body('firstName')
    .isLength({ min: 3 })
    .trim()
    .withMessage('must contain at least 3 characters'),
  body('email')
    .isEmail()
    .withMessage('must be a valid email')
    .normalizeEmail({ gmail_remove_dots: false })
    .toLowerCase()
    .trim(),
  body('password').isLength({ min: 8 })
    .withMessage('must contain at least 8 characters')
    .trim(),
];

exports.signinValidation = () => [
  body('email')
    .isEmail()
    .withMessage('must be a valid email')
    .normalizeEmail({ gmail_remove_dots: false })
    .toLowerCase()
    .trim(),
  body('password').isLength({ min: 8 })
    .withMessage('must contain at least 8 characters')
    .trim(),
];
