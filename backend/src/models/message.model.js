const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'user'
    },

    chat : {
        type :  mongoose.Schema.Types.ObjectId,
        ref : 'chat'
    }, 

    content : {
        type : String,
        required : true
    },

    role : {
        type : String,
        enum : ['user', 'model', 'system'], //enum bound krta hai ki role ki value hogi wo in array se koi ek ho skti h bs aur koi ni ho skta...By defualt yeha pe rehti hai 'user'
        default : 'user'
    }
},{
    timestamps : true
})

const messageModel = mongoose.model('message', messageSchema)

module.exports = messageModel