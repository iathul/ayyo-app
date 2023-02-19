const router = require('express').Router();
const auth = require('../controllers/auth');
const validator = require('./validation/validators');

// Signup route
router.post('/register', validator.signupValidation(), auth.register);

// Signin route
router.post('/login', validator.signinValidation(), auth.login);

// Verify email
router.get('/verify/email', auth.verifyEmail);

// Get reset password email
router.post('/password', validator.validateEmail(), auth.sendResetPswdLink);

// Update password

router.put('/password', validator.validatePassword(), auth.updatePassword);

module.exports = router;
