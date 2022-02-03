const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('./S3Config');

// For development
exports.storagePath = (name) => {
  const storage = multer.diskStorage({
    destination: `./media/${name}`,
    filename: (req, file, cb) => cb(null, `${file.originalname}`),
  });
  return storage;
};

// For production
exports.s3Storage = (name) => {
  const storageS3 = multerS3({
    s3,
    bucket: 'ayyo-file-storage',
    metadata(req, file, cb) {
      cb(null, {
        fieldName: `${name}`,
      });
    },
    key(req, file, cb) {
      cb(
        null,
        `${name}/${file.originalname}`
      );
    },
  });
  return storageS3;
};
