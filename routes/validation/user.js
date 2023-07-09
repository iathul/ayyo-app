const { body } = require('express-validator')

exports.updateUserValidation = () => [
  body('firstName')
    .trim()
    .not()
    .isEmpty()
    .withMessage('is required.')
    .isLength({ min: 3 })
    .withMessage('must contain at least 3 characters.')
]
