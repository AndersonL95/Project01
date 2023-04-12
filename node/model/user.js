const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    cargo: {
        type: Number,
        default: 0
    },
    picture: {
        type: String,
        required: true
   },
   verified: {
    type: Boolean,
    required: true
   }
})
module.exports = mongoose.model('Users', userSchema);