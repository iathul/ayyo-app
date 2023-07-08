/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },
  lastName: {
    type: String,
    trim: true,
    default: '',
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  salt: {
    type: String,
  },
  hashed_password: {
    type: String,
    required: true,
    min: 8,
    max: 1024,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  avatar: {
    type: String,
    required: false,
  },
  token: {
    type: String,
  },
  refresh_token: {
    type: String
  }
}, {
  timestamps: true
})

userSchema.virtual('password')
  .set(function (password) {
    this._password = password
    this.salt = uuidv4()
    this.hashed_password = this.securePassword(password)
  })
  .get(function () {
    return this._password
  })

userSchema.methods = {
  authenticate(plainPassword) {
    return this.securePassword(plainPassword) === this.hashed_password
  },
  securePassword(plainPassword) {
    if (!plainPassword) return ''
    try {
      return crypto
        .createHmac('sha256', this.salt)
        .update(plainPassword)
        .digest('hex')
    } catch (err) {
      return ''
    }
  },
  userDetails() {
    const user = {
      id: this._id,
      fullName: this.fullName(),
      email: this.email,
      isVerified: this.isVerified
    }
    return user
  },
  fullName() {
    return `${this.firstName} ${this.lastName}`
  }
}

module.exports = mongoose.model('User', userSchema)
