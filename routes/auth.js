const router = require('express').Router();
const {
  register,
  login,
  verifyEmail,
} = require('../controllers/auth');
const { signupValidation, signinValidation } = require('./validation/validators');

// Signup route
router.post('/register', signupValidation(), register);

// Signin route
router.post('/login', signinValidation(), login);

// Verify email
router.get('/verify/email/:token', verifyEmail);

module.exports = router;
