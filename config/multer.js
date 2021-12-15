const multer = require('multer');
const path = require('path');

exports.storagePath = (name) => {
  const storage = multer.diskStorage({
    destination: `./media/${name}`,
    filename: (req, file, cb) => cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`),
  });
  return storage;
};
