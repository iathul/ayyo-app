const multer = require('multer');
const { nanoid } = require('nanoid');
const File = require('../models/file');
const Package = require('../models/package');
const { storagePath } = require('../config/multer');

const storage = storagePath('/files');
const upload = multer({ storage }).array('fileData');

// Add files and create packge
exports.uploadFiles = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(500).json({
        error: 'Something went wrong. please try again',
      });
    }

    // Create and save files
    const files = req.files.map((file) => {
      const filedata = new File({
        // eslint-disable-next-line no-underscore-dangle
        user: req.auth._id,
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
    const newFiles = await File.insertMany(files);
    if (!newFiles) {
      return res.status(500).json({
        error: 'Something went wrong. please try again',
      });
    }

    // Create and save packge
    const packageId = `package_${nanoid()}`;
    const packageData = new Package({
      // eslint-disable-next-line no-underscore-dangle
      user: req.auth._id,
      packageId,
      files,
    });

    const newPackage = await packageData.save();
    if (!newPackage) {
      return res.status(500).json({
        error: 'Something went wrong. please try again',
      });
    }
    return res.status(200).json({
      message: 'Package created successfully',
      packageId,
    });
  });
};
