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
