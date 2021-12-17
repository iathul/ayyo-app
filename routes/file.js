const router = require('express').Router();
const {
  uploadFiles,
} = require('../controllers/file');
const { verifyToken, isAuthenticated } = require('../middlewares/auth');

// Add files
router.post('/add', verifyToken(), isAuthenticated, uploadFiles);

module.exports = router;
