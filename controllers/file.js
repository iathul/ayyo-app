const multer = require('multer');
const { nanoid } = require('nanoid');
const AdmZip = require('adm-zip');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const Package = require('../models/package');
const { storagePath, s3Storage } = require('../config/multer');
const s3 = require('../config/S3Config');

const storage = process.env.NODE_ENV === 'development' ? storagePath('files') : s3Storage();
const upload = multer({ storage }).array('fileData');

// Add files and create packge
exports.uploadFiles = (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: 'Something went wrong. please try again',
      });
    }

    // Create file object
    const files = req.files.map((file) => {
      const filedata = {
        destination: file.destination ? file.destination : file.location,
        encoding: file.encoding,
        metadata: file.metadata,
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
      package_expiry_date: moment().add(process.env.PACKAGE_EXPIRY_DAYS, 'd'),
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
  const fileUrl = `${
    process.env.NODE_ENV === 'development'
      ? process.env.BASE_URL
      : process.env.BASE_URL_PROD
  }/files/download/${packageId}`;
  return res.status(200).json({
    message: 'Sharable Link',
    url: fileUrl,
  });
};

// Download package
exports.dowloadPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const filePackage = await Package.findOne({ packageId });

    // Check if package is expired
    if (!filePackage || filePackage.package_expiry_date < moment()) {
      return res.status(400).json({
        error: 'This package has been expired',
      });
    }

    // Download package with single file
    if (filePackage.files.length === 1) {
      const fileData = filePackage.files[0];
      const filePath = fileData.path;
      if (process.env.NODE_ENV === 'development') {
        res.download(filePath, (err) => {
          if (err) {
            return res.status(500).json({
              error: 'Unable to download the package. please try again',
            });
          }
        });
      } else {
        const options = {
          Bucket: 'ayyo-file-storage',
          Key: fileData.metadata.fieldName,
        };
        res.attachment(fileData.metadata.fieldName);
        const fileStream = s3.getObject(options).createReadStream();
        fileStream.pipe(res);
      }
    } else {
      // Create zip for package with multiple files
      const zipFilePath = `${Date.now()}.zip`;
      const zip = new AdmZip();
      filePackage.files.forEach((file) => {
        zip.addLocalFile(file.path);
      });
      // Zip output folder
      const dir = './zip';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
      }
      // Save zip and download zip
      const zipOutputPath = path.join(process.cwd(), '/zip');
      fs.writeFileSync(`${zipOutputPath}/${zipFilePath}`, zip.toBuffer());
      res.download(`${zipOutputPath}/${zipFilePath}`, async (err) => {
        if (err) {
          console.log(err);
        }
        // Delete zip once download is complete
        await fs.unlink(`${zipOutputPath}/${zipFilePath}`, (error) => {
          if (error) {
            console.log(error);
          }
        });
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Unable to download the package. please try again',
    });
  }
};
