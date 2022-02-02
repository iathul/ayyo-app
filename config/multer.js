const multer = require('multer');
const multerS3 = require('multer-s3');
const path = require('path');
const s3 = require('./S3Config');

// For development
exports.storagePath = (name) => {
  const storage = multer.diskStorage({
    destination: `./media/files/${name}`,
    filename: (req, file, cb) => cb(null, `${file.originalname}`),
  });
  return storage;
};

// For production
exports.s3Storage = () => {
  const storageS3 = multerS3({
    s3,
    bucket: 'ayyo-file-storage',
    metadata(req, file, cb) {
      cb(null, {
        fieldName: `${file.fieldname}_${Date.now()}${path.extname(
          file.originalname
        )}`,
      });
    },
    key(req, file, cb) {
      cb(
        null,
        `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
      );
    },
  });
  return storageS3;
};
