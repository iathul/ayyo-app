const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

// Create an express app
const app = express()

app.use(helmet())
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*'
  })
)
app.use(express.urlencoded({ extended: false }))
app.use(express.json())
app.set('view engine', 'ejs')

// Logg requests
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line import/no-extraneous-dependencies, global-require
  const morgan = require('morgan')
  app.use(morgan('dev'))
}

// Rate limit auth and public download endpoints
const skipInTests = () => process.env.NODE_ENV === 'test'
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests
})
const downloadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: skipInTests
})
app.use('/api/v1/auth', authLimiter)
app.use('/api/v1/files/download', downloadLimiter)

// Routes
app.get('/', (req, res) => {
  res.send('<h3> <center> Hello from ayyo </center> </h3>')
})

// Api routes
app.use('/api/v1', require('./routes/index'))

module.exports = app
