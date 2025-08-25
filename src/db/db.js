const mongoose = require('mongoose')

async function connectDB()
{
    try
    {
        await mongoose.connect(process.env.MONGO_URI)
        console.log("Connected to MONGO DB")
    }

    catch(err)
    {
        console.log("Error connecting to mongo DB", err)
    }
}

module.exports = connectDB