const mongoose = require('mongoose');

const userVerificationSchema = new mongoose.Schema({
    _id: {
        type: String,
    },
    uniqueString: {
        type: String
    },
    createdAt: {
        type: Date
    },
    expiresAt: {
        type: Date
    }
});
module.exports = mongoose.model('UserVerification', userVerificationSchema);