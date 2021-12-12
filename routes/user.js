"use strict"

const router = require('express').Router()
const { 
    getUser,
    updateUser
} = require('../controllers/user')
const { verifyToken, isAuthenticated } = require('../middlewares/auth')


// Get user
router.get('/getUser', verifyToken(), isAuthenticated, getUser)

// Update user
router.put('/updateUser', verifyToken(), isAuthenticated, updateUser)

module.exports = router 