const multer = require('multer');
const { nanoid } = require('nanoid');
const AdmZip = require('adm-zip');
const fs = require('fs');
const moment = require('moment');
const path = require('path');
const { PassThrough } = require('stream');
const Package = require('../models/package');
const { s3Storage } = require('../config/multer');
const s3 = require('../config/S3Config');

exports.uploadFiles = (req, res) => {
  const fileLoc = nanoid(6);
  const storage = s3Storage(fileLoc);
  const upload = multer({ storage }).array('fileData');

  upload(req, res, async (err) => {
    if (err) {
      console.log(err);
      return res.status(500).json({
        error: 'Failed to upload files. Please try again.',
      });
    }

    // Create file object
    const files = req.files.map((file) => {
      const filedata = {
        destination: file.location,
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
      package_destination: `${fileLoc}`
    });

    const newPackage = await packageData.save();
    if (!newPackage) {
      return res.status(500).json({
        error: 'Failed to create package. Please try again.',
      });
    }
    return res.status(200).json({
      message: 'Package created successfully.',
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
      error: 'Package not found.',
    });
  }
  const fileUrl = `${process.env.NODE_ENV === 'development' ? process.env.BASE_URL
    : process.env.BASE_URL_PROD
  }/files/download/${packageId}`;
  return res.status(200).json({
    message: 'Sharable Link.',
    url: fileUrl,
  });
};

// Download package
exports.dowloadPackage = async (req, res) => {
  try {
    const { packageId } = req.params;
    const filePackage = await Package.findOne({ packageId });
    const packageModel = new Package();

    // Check if package is expired
    if (!filePackage || filePackage.package_expiry_date < moment()) {
      return res.status(400).json({
        error: 'This package has been expired.',
      });
    }

    // Download package with single file
    if (filePackage.files.length === 1) {
      const filePath = `${filePackage.package_destination}/${filePackage.files[0].originalname}`;

      // Download single file from S3
      const options = {
        Bucket: 'ayyo-file-storage',
        Key: filePath,
      };
      res.attachment(filePath);
      const fileStream = s3.getObject(options).createReadStream();
      fileStream.pipe(res);
      await packageModel.updatePackageStatus(packageId);
    }
    if (filePackage.files.length > 1) {
      // Download package with multiple files
      const fileDir = `./downloads/${filePackage.package_destination}`;
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }
      let complete = 0;
      const zip = new AdmZip();
      const downloadPath = path.join(process.cwd(), fileDir);
      filePackage.files.forEach((file) => {
        const filePath = `${filePackage.package_destination}/${file.originalname}`;
        const options = {
          Bucket: 'ayyo-file-storage',
          Key: filePath,
        };
        const fileStream = s3.getObject(options).createReadStream();
        const writeStream = fs.createWriteStream(
          `${downloadPath}/${file.originalname}`
        );
        fileStream.pipe(writeStream);
        writeStream.on('finish', async () => {
          complete += 1;
          if (complete === filePackage.files.length) {
            zip.addLocalFolder(fileDir);
            const zipFile = zip.toBuffer();
            res.attachment(`${Date.now()}.zip`);
            const zipStream = new PassThrough();
            zipStream.end(zipFile);
            zipStream.pipe(res);
            await packageModel.updatePackageStatus(packageId);
            fs.rmSync(fileDir, { recursive: true, force: true });
          }
        });
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Unable to download the package. Please try again.',
    });
  }
};
