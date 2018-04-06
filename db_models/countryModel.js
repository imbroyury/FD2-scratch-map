const mongoose = require('mongoose');

// User Schema
const countrySchema = mongoose.Schema({
    name: {
        type: String
    },
    nativeName: {
        type: String
    },
    capital: {
        type: String
    },
    alpha3Code: {
        type: String
    },
    region: {
        type: String
    },
    subregion: {
        type: String
    },
    area: {
        type: Number
    },
    population: {
        type: Number
    },
    mapFeatureID: {
        type: Number
    }
});

module.exports = mongoose.model('Country', countrySchema);