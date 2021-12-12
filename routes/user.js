const router = require('express').Router();
const {
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/user');
const { verifyToken, isAuthenticated } = require('../middlewares/auth');

// Get user
router.get('/getUser', verifyToken(), isAuthenticated, getUser);

// Update user
router.put('/updateUser', verifyToken(), isAuthenticated, updateUser);

// Delete user
router.delete('/deleteUser', verifyToken(), isAuthenticated, deleteUser);

module.exports = router;
