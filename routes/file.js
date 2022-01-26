const router = require('express').Router();
const file = require('../controllers/file');
const { verifyToken, isAuthenticated } = require('../middlewares/auth');

// Add files
router.post('/add', verifyToken(), isAuthenticated, file.uploadFiles);
router.get(
  '/sharable-link/:packageId',
  verifyToken(),
  isAuthenticated,
  file.shareFiles,
);
router.get(
  '/download/:packageId',
  verifyToken(),
  isAuthenticated,
  file.dowloadPackage,
);

module.exports = router;
