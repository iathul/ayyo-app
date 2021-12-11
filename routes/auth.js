const router = require('express').Router()
const { 
    signUp,
    signIn
} = require('../controllers/auth')
const { signupValidation, signinValidation } = require('./validation/validators')

// Signup route
router.post('/signup', signupValidation(), signUp)

// Signin route
router.post('/signin', signinValidation(), signIn)

module.exports = router 