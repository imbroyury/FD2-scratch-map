"use strict";
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const path = require('path');

// Bring in Models
let User = require('../db_models/userModel').User;
let UserCountry = require('../db_models/userModel').UserCountry;
let Country = require('../db_models/countryModel');

// Get Country Data for pop ups
router.get('/getCountryData/:ISO', (req, res) => {
    Country.findOne({'alpha3Code': req.params.ISO})
        .then(country => res.send(country).status(200).end())
        .catch(error => {
            console.log(error);
            res.send('Country data temporary unavailable').status(404).end();
        });
});

// Get Country Data for list
router.get('/getAllCountriesData', (req, res) => {
    Country.find({}, (error, data) => {
        if (error) {
            console.log(error);
        } else {
            let regObj = {},
                countries = [];
            Object.keys(data).forEach(key => {
                let co = data[key],
                    cv = {[co.alpha3Code]: co.name};
                countries.push({
                    [co.alpha3Code]: {
                        name: co.name,
                        mapFeatureID: co.mapFeatureID
                    }
                });

                if (!regObj[co.region]) {
                    regObj[co.region] = {[co.subregion]: [cv]};
                } else {
                    if (!regObj[co.region][co.subregion]) {
                        regObj[co.region][co.subregion] = [cv];
                    } else {
                        regObj[co.region][co.subregion].push(cv);
                    }
                }

            });
            res.send([regObj, countries]).status(200).end();
        }
    })
});

// Registration Process
router.post('/register', (req, res) => {
    /*
     * Functions below return a promise
     * which is resolved if no user is found
     * and reject with a message if it is
     */
    function findUsername(username) {
        return new Promise((resolve, reject) => {
            User.findOne({'username': username})
                .then(user => {
                    if (user) {
                        reject('Username already in use');
                    } else {
                        resolve();
                    }
                })
                .catch((error) => reject(error));
        });
    }

    function findEmail(email) {
        return new Promise((resolve, reject) => {
            User.findOne({'email': email}, (err, user) => {
                if (user) {
                    reject('Email already in use');
                } else {
                    resolve();
                }
            });
        });
    }

    function registerNewUser() {
        let newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            colorSettings: req.body.colorSettings
        });

        bcrypt.genSalt(10)
            .then(salt => bcrypt.hash(newUser.password, salt))
            .then(hash => {
                newUser.password = hash;
                newUser.save();
            })
            .then(() => {
                console.log('New User Registered');
                res.json({
                    success: true,
                    message: `New user ${req.body.username} registered`
                }).status(200).end();
            })
            .catch(err => sendError(err));
    }

    function sendError(error) {
        console.log(error);
        res.json({
            success: false,
            message: 'Error registering user. Try again later'
        }).status(500).end();
    }

    async function userRegistration() {
        try {
            await findUsername(req.body.username);
            await findEmail(req.body.email);
            registerNewUser();
        }
        catch (msg) {
            res.json({
                success: false,
                message: msg
            }).status(500).end();
        }
    }

    userRegistration();
});

// Login Process
router.post('/login', (req, res, next) => {
    passport.authenticate('local', (err, user, info) => {
        if (err) return next(err);
        if (!user) {
            return res.status(200).json({
                isLoggedIn: false,
                message: 'Incorrect username or password'
            }).end();
        }
        req.logIn(user, err => {
            if (err) return next(err);
            return res.status(200).json({
                isLoggedIn: true,
                username: req.user.username,
                colorSettings: req.user.colorSettings
            }).end();
        });
    })(req, res, next);
});

// Logout Process
router.post('/logout', (req, res) => {
    console.log('logout request received');
    req.session.destroy();
    res.status(200).end();
});

// Check Log In
router.get('/checklogin', (req, res) => {
    if (req.user) {
        res.status(200).json({
            isLoggedIn: true,
            username: req.user.username,
            colorSettings: req.user.colorSettings
        }).end();
    } else {
        res.status(200).json({
            isLoggedIn: false,
            username: null
        }).end();
    }
});

// Get User Countries
router.get('/getUserCountries/:username', (req, res) => {
    User.findOne({'username': req.params.username})
        .then(user => res.json(user.countries).status(200).end())
        .catch(error => {
            console.log(error);
            res.status(404).end();
        });
});

// Saving New User Country / Modifying User Country to DB
router.post('/addUserCountry/:username', (req, res) => {
    User.findOne({'username': req.params.username})
        .then(user => {
            let existingCountryEntry = user.countries.find(country => country.ISO === req.body.ISO);
            if (existingCountryEntry) {
                existingCountryEntry.status = req.body.status;
            } else {
                let newCountry = new UserCountry({
                    ISO: req.body.ISO,
                    status: req.body.status
                });
                user.countries.push(newCountry);
            }
            return user.save();
        })
        .then(() => {
            console.log('New Country Saved');
            res.status(200).end();
        })
        .catch(error => {
            console.log('Error saving user (add country)');
            console.log(error);
            res.status(500).end();
        });
});

// Removing User Country from DB
router.post('/removeUserCountry/:username', (req, res) => {
    User.findOne({'username': req.params.username})
        .then(user => {
            user.countries.find(country => country.ISO === req.body.ISO).remove();
            return user.save();
        })
        .then(() => {
            console.log('Country Deleted');
            res.status(200).end();
        }).catch(error => {
            console.log('Error saving user (remove country)');
            console.log(error);
            res.status(500).end();
        });
});


// Updating color settings
router.post('/updateSettings/:username', (req, res) => {
    User.findOne({'username': req.params.username})
        .then(user => {
            user.colorSettings = JSON.stringify(req.body);
            return user;
        })
        .then(user => user.save())
        .then(() => {
            console.log('Color settings saved');
            res.status(200).end();
        }).catch(error => {
            console.log('Error saving user');
            console.log(error);
            res.status(500).end();
        });
});

module.exports = router;