const router = require('express').Router();
const file = require('../controllers/file');
const { verifyToken, isAuthenticated } = require('../middlewares/auth');

// Add files
router.post('/add', verifyToken(), isAuthenticated, file.uploadFiles);

module.exports = router;
