const multer = require('multer');
const { storagePath } = require('../config/multer');

// Get user
exports.getUser = (req, res) => {
  const user = req.authUser;
  return res.json(user);
};

// Update user
exports.updateUser = async (req, res) => {
  const user = req.authUser;
  const { firstName, lastName } = req.body;

  user.firstName = firstName;
  user.lastName = lastName;

  const updated = await user.save();

  if (!updated) {
    return res.status(500).json({
      error: 'Something went wrong. Please try again',
    });
  }
  return res.status(200).json({
    message: 'User updated successfully',
  });
};

// Delete user
exports.deleteUser = async (req, res) => {
  const user = req.authUser;
  const deleted = await user.remove();

  if (!deleted) {
    return res.status(500).json({
      error: 'Something went wrong. Please try again',
    });
  }
  return res.status(200).json({
    message: 'User deleted successfully',
  });
};

// Update avatar
exports.changeAvatar = async (req, res) => {
  const user = req.authUser;
  const uniqueFolder = Math.floor(100000 + Math.random() * 900000);
  const storage = storagePath(`profile/avatar/${uniqueFolder}`);
  const upload = multer({ storage }).single('avatar');

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        error: 'Cannot add profile picture. Please try again.',
      });
    }

    user.avatar = req.file.filename;
    const updated = user.save();

    if (!updated) {
      return res.status(400).json({
        error: 'Cannot change avatar. Please try again.',
      });
    }
    return res.status(200).json({
      message: 'Avatar added Sucessfully.',
    });
  });
};

// Todo delete avatar
