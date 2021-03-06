const LocalStrategy = require('passport-local').Strategy;
const User = require('../db_models/userModel').User;
const bcrypt = require('bcryptjs');

module.exports = function(passport) {
    passport.use(new LocalStrategy((username, password, done) => {
        // Match Username
        let query = {username};
        User.findOne(query, (err, user) => {
            if (err) console.log(err);
            if (!user) {
                return done(null, false);
            }
            // Match Password
            bcrypt.compare(password, user.password, (err, isMatch) => {
                if (err) console.log(err);
                if (isMatch) {
                    return done(null, user);
                } else {
                    return done(null, false);
                }
            });
        });
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser((id, done) => {
        User.findById(id, (err, user) => {
            done(err, user);
        });
    });
};