const router = require('express').Router()
const file = require('../controllers/file')
const { verifyToken, isAuthenticated } = require('../middlewares/auth')

// Add files
router.post('/', verifyToken(), isAuthenticated, file.uploadFiles)

// Create sharable link
router.get(
  '/sharable-link/:packageId',
  verifyToken(),
  isAuthenticated,
  file.shareFiles,
)

// Download files
router.get('/download/:packageId', file.downloadPackage)

module.exports = router
