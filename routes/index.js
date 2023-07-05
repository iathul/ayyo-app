const router = require('express').Router()

const auth = require('./auth')
const user = require('./user')
const file = require('./file')

router.use('/auth', auth)
router.use('/users', user)
router.use('/files', file)

module.exports = router
