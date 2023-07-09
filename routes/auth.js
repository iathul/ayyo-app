const router = require('express').Router()
const auth = require('../controllers/auth')
const authValidator = require('./validation/auth')

// Signup route
router.post('/register', authValidator.signupValidation(), auth.register)

// Sign in route
router.post('/login', authValidator.signinValidation(), auth.login)

// Verify email
router.get('/verify/email', auth.verifyEmail)

// Get reset password email
router.post('/password', authValidator.validateEmail(), auth.sendResetPswdLink)

// Update password
router.put('/password', authValidator.validatePassword(), auth.updatePassword)

// Resend verification email
router.post(
  '/verify/email',
  authValidator.validateEmail(),
  auth.sendEmailVerificationLink
)

// Get new access token using refresh token
router.post(
  '/refresh-token',
  authValidator.validateRefreshToken(),
  auth.getAccessToken
)

module.exports = router
