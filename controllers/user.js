const { validationResult } = require('express-validator')
const multer = require('multer')
const { nanoid } = require('nanoid')
const { storagePath } = require('../config/multer')
const User = require('../models/user')

// Request validation
const requestValidation = async (req) => {
  const errors = await validationResult(req)
  if (!errors.isEmpty()) {
    return `${errors.array()[0].param} ${errors.array()[0].msg}`
  }
}

// Get user
exports.getUser = (req, res) => {
  try {
    const user = req.authUser
    return res.status(200).json({
      message: 'User details',
      user
    })
  } catch (error) {
    console.log(`Failed to fetch user details - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to fetch user details. Please try again.'
    })
  }
}

// Update user
exports.updateUser = async (req, res) => {
  try {
    // Request validation
    const error = await requestValidation(req, res)
    if (error) {
      return res.status(422).json({
        error
      })
    }
    const user = req.authUser
    const { firstName, lastName } = req.body
    const userModel = new User()
    const userDetails = {
      firstName,
      lastName
    }
    const updatedUser = await userModel.updateUserDetails(user.id, userDetails)
    if (!updatedUser) {
      return res.status(500).json({
        error: 'Failed to update user details. Please try again.'
      })
    }
    return res.status(200).json({
      message: 'User updated successfully.',
      user: updatedUser.userDetails()
    })
  } catch (error) {
    console.log(`Failed to update user details - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to update user details. Please try again.'
    })
  }
}

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const user = req.authUser
    const deleted = await user.remove()

    if (!deleted) {
      return res.status(500).json({
        error: 'Failed to remove user. Please try again.'
      })
    }
    return res.status(200).json({
      message: 'User remove successfully.'
    })
  } catch (error) {
    console.log(`Failed to remove user - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to remove user. Please try again.'
    })
  }
}

// Update avatar
exports.changeAvatar = async (req, res) => {
  try {
    const user = req.authUser
    const fileLoc = nanoid(6)
    const storage = storagePath(`avatar/${fileLoc}`)
    const upload = multer({ storage }).single('avatar')

    upload(req, res, err => {
      if (err) {
        return res.status(400).json({
          error: 'Failed update avatar. Please try again.'
        })
      }

      user.avatar = req.file.path
      const updated = user.save()

      if (!updated) {
        return res.status(400).json({
          error: 'Failed update avatar. Please try again.'
        })
      }
      return res.status(200).json({
        message: 'Avatar updated successfully.'
      })
    })
  } catch (error) {
    console.log(`Failed update avatar - ${error.message}`)
    return res.status(500).json({
      error: 'Failed update avatar. Please try again.'
    })
  }
}
