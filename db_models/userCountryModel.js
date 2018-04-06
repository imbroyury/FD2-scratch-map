const mongoose = require('mongoose');

// User Country Schema
const UserCountrySchema = mongoose.Schema({
    ISO: {
        type: String
    },
    status: {
        type: String
    }
});

module.exports = mongoose.model('UserCountry', UserCountrySchema);