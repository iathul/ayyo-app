const router = require('express').Router();
const user = require('../controllers/user');
const { verifyToken, isAuthenticated } = require('../middlewares/auth');

// Get user
router.get('/', verifyToken(), isAuthenticated, user.getUser);

// Update user
router.put('/', verifyToken(), isAuthenticated, user.updateUser);

// Delete user
router.delete('/', verifyToken(), isAuthenticated, user.deleteUser);

// Change avatar
router.put('/avatar', verifyToken(), isAuthenticated, user.changeAvatar);

module.exports = router;
