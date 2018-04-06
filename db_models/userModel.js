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

// User Schema
const UserSchema = mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    countries: [UserCountrySchema],
    colorSettings: {
        type: String
    }
});


module.exports = {
    User: mongoose.model('User', UserSchema),
    UserCountry: module.exports = mongoose.model('UserCountry', UserCountrySchema)
};