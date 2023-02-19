const crypto = require('crypto');

exports.createVerificationToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  return token;
};
