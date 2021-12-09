// Load environment variables
require('dotenv').config()

// Import database connection
const connectDB = require('./config/db')

// Start db
connectDB()

// Import packages
const express = require('express')

//Create an express app
const app = express()

app.use(express.urlencoded({ extended: false }))   
app.use(express.json())

const PORT = process.env.PORT || 5000

// Start server
app.listen(PORT, 
    console.log(`Server Runnig at PORT: ${PORT}`)
)
