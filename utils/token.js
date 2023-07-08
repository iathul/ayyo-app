const crypto = require('crypto')
const jwt = require('jsonwebtoken')

exports.createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex')
  return token
}

exports.generateAccessRefreshToken = (user, type) => {
  const secret = process.env[`${type.toUpperCase()}_TOKEN_SECRET`]
  const expiresIn = process.env[`${type.toUpperCase()}_TOKEN_EXPIRY`]

  return jwt.sign({ _id: user._id }, secret, { expiresIn })
}
