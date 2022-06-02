const multer = require('multer');
const { nanoid } = require('nanoid');
const { storagePath } = require('../config/multer');

// Get user
exports.getUser = (req, res) => {
  try {
    const user = req.authUser;
    return res.json(user);
  } catch (error) {
    console.log(error);
  }
};

// Update user
exports.updateUser = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
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
  } catch (error) {
    console.log(error);
  }
};

// Update avatar
exports.changeAvatar = async (req, res) => {
  try {
    const user = req.authUser;
    const fileLoc = nanoid(6);
    const storage = storagePath(`avatar/${fileLoc}`);
    const upload = multer({ storage }).single('avatar');

    upload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          error: 'Cannot add profile picture. Please try again.',
        });
      }

      user.avatar = req.file.path;
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
  } catch (error) {
    console.log(error);
  }
};

// Todo delete avatar
