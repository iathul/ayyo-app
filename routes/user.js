"use strict"

const router = require('express').Router()
const { 
    getUser
} = require('../controllers/user')
const { verifyToken, isAuthenticated } = require('../middlewares/auth')


// Get user
router.get('/getUser', verifyToken(), isAuthenticated, getUser)

module.exports = router 