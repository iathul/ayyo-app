const expressjwt = require('express-jwt')
const User = require('../models/user')

exports.verifyToken = () => expressjwt(
  {
    secret: process.env.TOKEN_SECRET,
    algorithms: ['HS256'],
    credentialsRequired: false,
    userProperty: 'auth',
  },
  (err, req, res, next) => {
    if (err) {
      return res.status(err.status).json({
        error: 'Token expired. You are not authenticated. Please login.',
      })
    }
    return next()
  }
)

exports.isAuthenticated = async (req, res, next) => {
  if (req.auth) {
    const authUser = await User.findById(req.auth._id).select({
      salt: 0,
      hashed_password: 0,
    })
    if (!authUser) {
      return res.status(403).json({
        error: 'You are not authenticated. Please login',
      })
    }
    req.authUser = authUser
    next()
  }
}
