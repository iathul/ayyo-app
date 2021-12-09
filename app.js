require('dotenv').config()
const express = require('express')

//Create an express app
const app = express()

app.use(express.urlencoded({ extended: false }))   
app.use(express.json())

const PORT = process.env.PORT || 5000

app.listen(PORT, 
    console.log(`Server Runnig at PORT: ${PORT}`)
)
