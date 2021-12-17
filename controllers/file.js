const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/file');
const { storagePath } = require('../config/multer');

const storage = storagePath('/files');
const upload = multer({ storage }).array('fileData');

exports.uploadFiles = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        error: 'Something went wrong. please try again',
      });
    }
    const transferId = uuidv4();
    const data = req.files.map((file) => {
      const filedata = new File({
        // eslint-disable-next-line no-underscore-dangle
        user: req.auth._id,
        transferId,
        destination: file.destination,
        encoding: file.encoding,
        fieldname: file.fieldname,
        filename: file.filename,
        mimetype: file.mimetype,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
      });
      return filedata;
    });

    const file = await File.insertMany(data);
    if (!file) {
      return res.status(500).json({
        error: 'Something went wrong. please try again',
      });
    }
    return res.status(200).json({
      message: 'Files added successfully',
    });
  });
};
