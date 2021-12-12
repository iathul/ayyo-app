"use strict"

const User = require('../models/user')
const expressjwt = require('express-jwt')

exports.verifyToken = () => {
    return [
        expressjwt({
            secret: process.env.TOKEN_SECRET,
            userProperty: "auth",
            algorithms: ['HS256']
        }),
        (err, req, res, next) => {
            res.status(err.status).json({ error: err.message})
        }
    ]
}

exports.isAuthenticated = async (req, res, next) => {

    try {
        const authUser = await User.findById(req.auth._id).select({
            salt: 0, 
            hashed_password: 0, 
        })
        if(!authUser) {
            return res.status(403).json({
                error: "You are not authenticated. Please login"
            })
        }
        req.authUser = authUser
        next() 

    } catch (error) {
        throw error
    }
}