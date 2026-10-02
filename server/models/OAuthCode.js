const mongoose = require('mongoose');

const oauthCodeSchema = new mongoose.Schema({
    codeHash: {
        type: String,
        required: true,
        unique: true,
        index: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 60, // MongoDB TTL index: automatically deletes document after 60 seconds
    }
});

module.exports = mongoose.model('OAuthCode', oauthCodeSchema);
