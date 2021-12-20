const router = require('express').Router();
const {
  register,
  login,
  verifyEmail,
  sendResetPswdLink,
  updatePassword,
} = require('../controllers/auth');
const {
  signupValidation,
  signinValidation,
  validateEmail,
  validatePassword,
} = require('./validation/validators');

// Signup route
router.post('/register', signupValidation(), register);

// Signin route
router.post('/login', signinValidation(), login);

// Verify email
router.get('/verify/email/:token', verifyEmail);

// Get reset password email
router.post('/password', validateEmail(), sendResetPswdLink);

// Update password
router.post('/password/update/:token', validatePassword(), updatePassword);

module.exports = router;
