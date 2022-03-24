const AWS = require('aws-sdk');

const S3 = new AWS.S3();

S3.config.update({
  secretAccessKey: process.env.AWS_S3_ACCESS_KEY,
  accessKeyId: process.env.AWS_S3_ACCESS_KEY_ID,
  region: process.env.AWS_S3_REGION,
});

module.exports = S3;
