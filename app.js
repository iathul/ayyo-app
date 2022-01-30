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

// Routes
app.get('/', (req, res) => {
  res.send('<h3> <center> Hello from ayyo </center> </h3>');
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/files', require('./routes/file'));

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, console.log(`Server Runnig at PORT: ${PORT}`));
