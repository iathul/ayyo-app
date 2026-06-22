require('dotenv').config()

const connectDB = require('../config/db')
const runJobs = require('../jobRunner')
const app = require('../app')

connectDB()
runJobs()

const PORT = process.env.PORT || 5000

app.listen(PORT, () => console.log(`Server running at PORT: ${PORT}`))
