const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const passport = require('passport');
const path = require('path');

// Init Express App
const app = express();

// Init DB
mongoose.connect('mongodb://localhost:27017/scratchmap');
let db = mongoose.connection;

// Check connection
db.once('open', () => console.log('Connected to MongoDB'));

// Check for DB errors
db.on('error', error => console.log(error));

// Set Public Folder
app.use(express.static(path.join(__dirname, 'public')));

// Body Parser Middleware
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}));
// parse application/json
app.use(bodyParser.json());

// Express Session Middleware
app.use(session({
    secret: 'keyboard cat',
    resave: true,
    saveUninitialized: true
}));

// Start Server
app.listen('3000', () => console.log('Server started on port 3000...'));

// Passport Config
require('./config/passport')(passport);
// Passport Middleware
app.use(passport.initialize());
app.use(passport.session());

app.get('*', (req, res, next) => {
    res.locals.user = req.user || null;
    next();
});

// Route Files
let routes = require('./routes/routes');
app.use('/', routes);
