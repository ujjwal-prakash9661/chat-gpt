const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    user : 
    {
        type : mongoose.Schema.Types.ObjectId,  //YHA ID store ho rhi user ki
        ref : 'user',   //ye id user collection se belong krti itna hi btate hain(userModel ke 'user' ye wahi hai)
        required : true
    },

    title : 
    {
        type : String,
        required : true
    },

    lastActivity : 
    {
        type : Date,
        default : Date.now
    }
}, 
    {
        timestamps : true
    }
)

const chatModel = mongoose.model('chat', chatSchema)

module.exports = chatModel