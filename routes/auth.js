const router = require('express').Router();
const {
  register,
  login,
} = require('../controllers/auth');
const { signupValidation, signinValidation } = require('./validation/validators');

// Signup route
router.post('/register', signupValidation(), register);

// Signin route
router.post('/login', signinValidation(), login);

module.exports = router;
