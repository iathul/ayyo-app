const { validationResult } = require('express-validator')
const User = require('../models/user')
const {
  sendEmailVerificationLink,
  sendResetPswdLink
} = require('../emails/email')
const {
  createVerificationToken,
  generateAccessRefreshToken
} = require('../utils/token')

// Request validation
const requestValidation = async (req, res) => {
  const errors = await validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      error: `${errors.array()[0].param} ${errors.array()[0].msg}`
    })
  }
}

// User signup
exports.register = async (req, res) => {
  try {
    // Request validation
    requestValidation(req, res)

    const {
      firstName,
      lastName,
      email,
      password
    } = req.body

    const userExists = await User.findOne({ email })
    if (userExists) {
      return res.status(400).json({
        error: 'User already exists.'
      })
    }

    const token = createVerificationToken()
    const user = new User({
      firstName,
      lastName,
      email,
      password,
      token
    })
    const newUser = await user.save()

    if (!newUser) {
      return res.status(400).json({
        error: 'Signup failed. Please try again.'
      })
    }

    // Send email verification link
    sendEmailVerificationLink(newUser)

    return res.status(200).json({
      message: 'Signup success',
      user: newUser.userDetails()
    })
  } catch (error) {
    console.log(`Signup failed. ${error.message}`)
    return res.status(500).json({
      error: 'Signup failed. Please try again.'
    })
  }
}

// Verify email
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query
    if (token) {
      const verified = await User.findOneAndUpdate(
        { token },
        { $set: { isVerified: true, token: null } },
        { new: true }
      )

      if (!verified) {
        return res.status(400).json({
          error: 'Email already verified.'
        })
      }

      return res.status(200).json({
        message: 'Email verified successfully'
      })
    }
    return res.status(400).json({
      error: 'Invalid token or email already verified.'
    })
  } catch (error) {
    console.log(`Failed to verify email - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to verify email. Please try again.'
    })
  }
}

// User login
exports.login = async (req, res) => {
  try {
    // Request validation
    requestValidation(req)

    const { email, password } = req.body
    const user = await User.findOne({ email })

    if (!user) {
      return res.status(404).json({
        error: 'User not found. Please signup'
      })
    }

    if (!user.isVerified) {
      return res.status(400).json({
        error: 'Please verify your account.'
      })
    }

    if (!user.authenticate(password)) {
      return res.status(401).json({
        error: 'Invalid password'
      })
    }

    const access_token = generateAccessRefreshToken(user, 'access')
    const refresh_token = generateAccessRefreshToken(user, 'refresh')

    user.refresh_token = refresh_token
    await user.save()

    return res
      .status(200)
      .json({ access_token, refresh_token, user: user.userDetails() })
  } catch (error) {
    console.log(`Login failed - ${error.message}`)
    return res.status(500).json({
      error: 'Login failed. Please try again.'
    })
  }
}

// Send reset password link
exports.sendResetPswdLink = async (req, res) => {
  try {
    requestValidation(req)

    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).json({
        error: 'Invalid email'
      })
    }

    // Update token
    const token = createVerificationToken()
    user.token = token
    await user.save()

    // Send reset password link
    sendResetPswdLink(user)

    return res.status(200).json({
      message: 'An email with password reset link has been sent.'
    })
  } catch (error) {
    console.log(`Failed to send password reset link - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to send password reset link. Please try again.'
    })
  }
}

// Update password
exports.updatePassword = async (req, res) => {
  try {
    requestValidation(req)

    const { token } = req.query
    if (token) {
      const user = await User.findOne({ token })
      if (!user) {
        return res.status(400).json({
          error: 'Password link expired or Invalid.'
        })
      }
      user.password = req.body.new_password
      user.token = null
      const updated = await user.save()
      if (!updated) {
        return res.status(400).json({
          error: 'Failed to password.Please try again.'
        })
      }
      return res.status(200).json({
        message: 'Password updated successfully.'
      })
    }
  } catch (error) {
    console.log(`Failed to update password - ${error.message}`)
    return res.status(500).json({
      error: 'Failed update password. Please try again.'
    })
  }
}

// Resend email verification link
exports.sendEmailVerificationLink = async (req, res) => {
  try {
    requestValidation(req, res)

    const user = await User.findOne({ email: req.body.email })
    if (!user) {
      return res.status(404).json({
        error: 'User not found.'
      })
    }

    // Update token
    const token = createVerificationToken()
    user.token = token
    await user.save()

    // Send email verification link
    sendEmailVerificationLink(user)

    return res.status(200).json({
      message: 'An email with verification link has been sent.'
    })
  } catch (error) {
    console.log(`Failed to resent verification email - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to resent verification email. Please try again.'
    })
  }
}
