/* eslint-disable global-require */

// Load environment variables
require('dotenv').config();

// Import packages
const express = require('express');
const cors = require('cors');

// Import database connection
const connectDB = require('./config/db');

// Start db
connectDB();

// Create an express app
const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');

// Logg requests
if (process.env.NODE_ENV === 'development') {
  // eslint-disable-next-line import/no-extraneous-dependencies
  const morgan = require('morgan');
  app.use(morgan('dev'));
}

// Routes
app.get('/', (req, res) => {
  res.send('<h3> <center> Hello from ayyo </center> </h3>');
});

// Api routes
app.use('/api/v1', require('./routes/index'));

// Import and run jobs
const runJobs = require('./jobRunner');

runJobs();

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, console.log(`Server Runnig at PORT: ${PORT}`));
