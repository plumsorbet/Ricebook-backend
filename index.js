require('dotenv').config();

const auth = require('./src/auth');
const article = require('./src/articles');
const profile = require('./src/profile');
const following = require('./src/following');
const oauth = require('./src/oauth')

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const mongoose = require('mongoose');
const userSchema = require('./src/models/userSchema');
const User = mongoose.model('user', userSchema);
const connectionString = 'mongodb+srv://username:88888888@cluster0.tcvla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connector = mongoose.connect(connectionString);

const session = require('express-session');
const passport = require('passport');

const hello = (req, res) => res.send({ hello: 'world' });

const corsOptions = {
    origin: ['http://localhost:3001', 'https://social-media-frontend.surge.sh'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200,
};

const app = express();
app.set('trust proxy', 1);
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors(corsOptions));
app.use(
    session({
        secret: "doNotGuessTheSecret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: true,
            sameSite: 'None',
            httpOnly: true,
        }
    })
);
app.use(passport.initialize());
app.use(passport.session());
app.get('/', hello);
oauth(app);
auth.setupRoutes(app);
article(app);
profile(app);
following(app);

// Get the port from the environment, i.e., Heroku sets it
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
     const addr = server.address();
     console.log(`Server listening at http://${addr.address}:${addr.port}`)
});
