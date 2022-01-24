const router = require('express').Router();
const user = require('../controllers/user');
const { verifyToken, isAuthenticated } = require('../middlewares/auth');

// Get user
router.get('/getUser', verifyToken(), isAuthenticated, user.getUser);

// Update user
router.put('/updateUser', verifyToken(), isAuthenticated, user.updateUser);

// Delete user
router.delete('/deleteUser', verifyToken(), isAuthenticated, user.deleteUser);

// Change avatar
router.put('/profile/avatar', verifyToken(), isAuthenticated, user.changeAvatar);

module.exports = router;
