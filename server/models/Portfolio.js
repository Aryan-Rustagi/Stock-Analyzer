const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    symbol: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('Portfolio', portfolioSchema);