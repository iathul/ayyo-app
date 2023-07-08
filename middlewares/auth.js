const expressJwt = require('express-jwt')
const User = require('../models/user')

exports.verifyToken = () => (req, res, next) => {
  expressJwt({
    secret: process.env.ACCESS_TOKEN_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: false,
    userProperty: 'auth'
  })(req, res, (err) => {
    if (err) {
      return res.status(err.status).json({
        error: 'Token expired. You are not authenticated. Please login.'
      })
    }
    next(err)
  })
}

exports.isAuthenticated = async (req, res, next) => {
  if (!req.auth) {
    return res.status(403).json({
      error: 'You are not authenticated. Please login'
    })
  }

  try {
    const authUser = await User.findById(req.auth._id)
    if (!authUser) {
      return res.status(403).json({
        error: 'You are not authenticated. Please login'
      })
    }
    req.authUser = authUser.userDetails()
    next()
  } catch (err) {
    next(err)
  }
}
