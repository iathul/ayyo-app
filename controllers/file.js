const multer = require('multer')
const { nanoid } = require('nanoid')
const AdmZip = require('adm-zip')
const fs = require('fs')
const os = require('os')
const moment = require('moment')
const path = require('path')
const { PassThrough } = require('stream')
const Package = require('../models/package')
const { s3Storage } = require('../config/multer')
const s3 = require('../config/S3Config')
const sanitizeFilename = require('../utils/sanitizeFilename')

exports.uploadFiles = (req, res) => {
  try {
    const fileLoc = nanoid()
    const storage = s3Storage(fileLoc)
    const upload = multer({ storage }).array('fileData')

    upload(req, res, async (error) => {
      if (error) {
        console.log(`Failed to upload files - ${error.message}`)
        return res.status(500).json({
          error: 'Failed to upload files. Please try again.'
        })
      }

      // Create file object
      const files = req.files.map((file) => {
        const fileData = {
          destination: file.location,
          encoding: file.encoding,
          metadata: file.metadata,
          fieldName: file.fieldName,
          filename: file.filename,
          mimetype: file.mimetype,
          originalname: sanitizeFilename(file.originalname),
          path: file.path,
          size: file.size
        }
        return fileData
      })

      // Create and save package
      const packageId = `package_${nanoid()}`
      const packageData = new Package({
        user: req.auth._id,
        packageId,
        files,
        package_expiry_date: moment().add(process.env.PACKAGE_EXPIRY_DAYS, 'd'),
        package_destination: `${fileLoc}`
      })

      const newPackage = await packageData.save()
      if (!newPackage) {
        return res.status(500).json({
          error: 'Failed to create package. Please try again.'
        })
      }
      return res.status(200).json({
        message: 'Package created successfully.',
        packageId
      })
    })
  } catch (error) {
    console.log(`Failed to create package - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to create package. Please try again.'
    })
  }
}

// Create sharable link
exports.shareFiles = async (req, res) => {
  try {
    const { packageId } = req.params
    const filePackage = await Package.findOne({ packageId })
    if (!filePackage) {
      return res.status(404).json({
        error: 'Package not found.'
      })
    }
    const fileUrl = `${
      process.env.NODE_ENV === 'development'
        ? process.env.BASE_URL
        : process.env.BASE_URL_PROD
    }/api/v1/files/download/${packageId}`
    return res.status(200).json({
      message: 'Sharable Link.',
      url: fileUrl
    })
  } catch (error) {
    console.log(`Failed to create sharable link - ${error.message}`)
    return res.status(500).json({
      error: 'Failed to create sharable link. Please try again.'
    })
  }
}

// Download package
exports.downloadPackage = async (req, res) => {
  try {
    const { packageId } = req.params
    const filePackage = await Package.findOne({ packageId })
    const packageModel = new Package()

    // Check if package is expired
    if (!filePackage || filePackage.package_expiry_date < moment()) {
      return res.status(400).json({
        error: 'This package has been expired.'
      })
    }

    // Download package with single file
    if (filePackage.files.length === 1) {
      const filePath = `${filePackage.package_destination}/${filePackage.files[0].originalname}`

      // Download single file from S3
      const options = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: filePath
      }

      // Record the download before opening the S3 stream so the status
      // write can't race a stream error firing mid-await.
      await packageModel.updatePackageStatus(packageId)

      const fileStream = s3.getObject(options).createReadStream()
      fileStream.on('error', (err) => {
        console.log(`Failed to stream file from S3 - ${err.message}`)
        if (!res.headersSent) {
          res.status(500).json({ error: 'Unable to download the package. Please try again.' })
        }
      })
      res.attachment(filePath)
      fileStream.pipe(res)
      return
    }
    if (filePackage.files.length > 1) {
      // Download package with multiple files - use a unique per-request temp
      // dir so concurrent downloads of the same package don't race on disk.
      const fileDir = path.join(os.tmpdir(), `ayyo-${nanoid()}`)
      fs.mkdirSync(fileDir, { recursive: true })

      let complete = 0
      let failed = false
      const zip = new AdmZip()
      const cleanup = () => fs.rmSync(fileDir, { recursive: true, force: true })
      const failOnce = (err) => {
        if (failed) return
        failed = true
        console.log(`Failed to download package - ${err.message}`)
        cleanup()
        if (!res.headersSent) {
          res.status(500).json({ error: 'Unable to download the package. Please try again.' })
        }
      }

      filePackage.files.forEach((file) => {
        const filePath = `${filePackage.package_destination}/${file.originalname}`
        const options = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: filePath
        }
        const fileStream = s3.getObject(options).createReadStream()
        const writeStream = fs.createWriteStream(`${fileDir}/${file.originalname}`)
        fileStream.on('error', failOnce)
        writeStream.on('error', failOnce)
        fileStream.pipe(writeStream)
        writeStream.on('finish', async () => {
          if (failed) return
          complete += 1
          if (complete === filePackage.files.length) {
            // Record the download before streaming the zip back, same reasoning
            // as the single-file path above.
            await packageModel.updatePackageStatus(packageId)
            zip.addLocalFolder(fileDir)
            const zipFile = zip.toBuffer()
            res.attachment(`${Date.now()}.zip`)
            const zipStream = new PassThrough()
            zipStream.end(zipFile)
            zipStream.pipe(res)
            cleanup()
          }
        })
      })
    }
  } catch (error) {
    console.log(`Failed to download package - ${error.message}`)
    return res.status(500).json({
      error: 'Unable to download the package. Please try again.'
    })
  }
}
