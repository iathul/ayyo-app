/* eslint-disable func-names */
/* eslint-disable no-underscore-dangle */
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

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
  emailVerified: {
    type: Boolean,
    default: false,
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

userSchema.virtual('password')
  .set(function (password) {
    this._password = password;
    this.salt = uuidv4();
    this.hashed_password = this.securePassword(password);
  })
  .get(function () {
    return this._password;
  });

userSchema.methods = {
  autheticate(plainpassword) {
    return this.securePassword(plainpassword) === this.hashed_password;
  },
  securePassword(plainpassword) {
    if (!plainpassword) return '';
    try {
      return crypto
        .createHmac('sha256', this.salt)
        .update(plainpassword)
        .digest('hex');
    } catch (err) {
      return '';
    }
  },
  userData() {
    const user = {
      id: this._id,
      fullName: this.fullName(),
      email: this.email,
      emailVerified: this.emailVerified,
      isVerified: this.isVerified,
    };
    return user;
  },
  fullName() {
    return `${this.firstName} ${this.lastName}`;
  },
};

module.exports = mongoose.model('User', userSchema);
