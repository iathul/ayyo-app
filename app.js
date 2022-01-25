// Load environment variables
require('dotenv').config();

// Import packages
const express = require('express');

// Import database connection
const connectDB = require('./config/db');

// Start db
connectDB();

// Create an express app
const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.set('view engine', 'ejs');

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/user'));
app.use('/api/files', require('./routes/file'));

const PORT = process.env.PORT || 5000;

// Start server
app.listen(PORT, console.log(`Server Runnig at PORT: ${PORT}`));
