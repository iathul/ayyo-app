const multer = require('multer');
const { nanoid } = require('nanoid');
const AdmZip = require('adm-zip');
const fs = require('fs');
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

    // Create file object
    const files = req.files.map((file) => {
      const filedata = {
        destination: file.destination,
        encoding: file.encoding,
        fieldname: file.fieldname,
        filename: file.filename,
        mimetype: file.mimetype,
        originalname: file.originalname,
        path: file.path,
        size: file.size,
      };
      return filedata;
    });

    // Create and save packge
    const packageId = `package_${nanoid()}`;
    const packageData = new Package({
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

// Create sharable link
// Todo share via email
exports.shareFiles = async (req, res) => {
  const { packageId } = req.params;
  const filePackage = await Package.findOne({ packageId });
  if (!filePackage) {
    return res.status(404).json({
      error: 'Package not found',
    });
  }
  const fileUrl = `${process.env.BASE_URL}/files/download/${packageId}`;
  return res.status(200).json({
    message: 'Sharable Link',
    url: fileUrl,
  });
};

// Download package
exports.dowloadPackage = async (req, res) => {
  const { packageId } = req.params;
  const filePackage = await Package.findOne({ packageId });
  if (!filePackage) {
    return res.status(400).json({
      error: 'This package has been expired',
    });
  }
  if (filePackage.files.length === 1) {
    const fileData = filePackage.files[0];
    const filePath = fileData.path;
    res.download(filePath);
  } else {
    const zipFilePath = `${Date.now()}.zip`;
    const zip = new AdmZip();
    filePackage.files.forEach((file) => {
      zip.addLocalFile(file.path);
    });
    fs.writeFileSync(zipFilePath, zip.toBuffer());
    res.download(zipFilePath);
  }
};
