const { body, query } = require('express-validator')

exports.signupValidation = () => [
  body('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.')
    .isLength({ min: 3 })
    .withMessage('must contain at least 3 characters.'),
  body('email')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.')
    .isEmail()
    .withMessage('must be valid email.')
    .normalizeEmail({ gmail_remove_dots: false })
    .toLowerCase(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('must contain at least 8 characters')
    .trim()
]

exports.signinValidation = () => [
  body('email')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.')
    .isEmail()
    .withMessage('must be valid email.')
    .normalizeEmail({ gmail_remove_dots: false })
    .toLowerCase(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('must contain at least 8 characters')
    .trim()
]

// Validate email to update password  & resend verification email
exports.validateEmail = () => [
  body('email')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.')
    .isEmail()
    .withMessage('must be valid email.')
    .normalizeEmail({ gmail_remove_dots: false })
    .toLowerCase()
]

// Validate new password
exports.validatePassword = () => [
  query('token')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.'),
  body('new_password')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.')
    .isLength({ min: 8 })
    .withMessage('must contain at least 8 characters.')
    .trim()
]
