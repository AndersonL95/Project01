const mongoose = require('mongoose');

const PasswordResetSchema = new mongoose.Schema({
    _id: String,
    resetString: String,
    createAt: Date,
    expiresAt: Date
})
module.exports =  mongoose.model('PasswordReset', PasswordResetSchema);