const mongoose = require('mongoose')

const options = {  
    useNewUrlParser: true,
    useUnifiedTopology: true 
}

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.LOCAL_DB, options
        )
            console.log(`MongoDB Connected: ${conn.connection.host}`)
    } catch (err) {
        console.error(err)
        process.exit(1)
    }
}

module.exports = connectDB