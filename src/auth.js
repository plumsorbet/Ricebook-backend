const mongoose = require("mongoose");
const userSchema = require('./models/userSchema');
const User = mongoose.model('user', userSchema);
const profileSchema = require('./models/profileSchema');
const Profile = mongoose.model('profile', profileSchema);

const connectionString = 'mongodb+srv://username:88888888@cluster0.tcvla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connector = mongoose.connect(connectionString);

let sessionUser = {};
let cookieKey = "sid";

// let userObjs = {};

const md5 = require('md5');
const crypto = require('crypto');

function isLoggedIn(req, res, next) {
    // likely didn't install cookie parser
    if (!req.cookies) {
       return res.sendStatus(401);
    }

    let sid = req.cookies[cookieKey];

    // no sid for cookie key
    if (!sid) {
        return res.sendStatus(401);
    }

    let username = sessionUser[sid];

    // no username mapped to sid
    if (username) {
        req.username = username;
        next();
    }
    else {
        return res.sendStatus(401)
    }
}

const login = async(req, res) => {
    let username = req.body.username;
    let password = req.body.password;

    // supply username and password
    if (!username || !password) {
        return res.sendStatus(400);
    }

    // let user = userObjs[username];
    let user = await User.findOne({username});

    if (!user) {
        return res.sendStatus(401);
    }
	
	
    // Create hash using md5, user salt and request password, check if hash matches user hash
    let hash = md5(user.salt + password);

    if (hash === user.hash) {
        // TODO: create session id, use sessionUser to map sid to user username 
        let sid = crypto.randomBytes(16).toString('hex'); // CHANGE THIS!
        sessionUser[sid] = username;

	// Adding cookie for session id
        res.cookie(cookieKey, sid, {
            maxAge: 3600 * 1000,
            httpOnly: true,
            secure: true,
            sameSite: 'None'
        });
        let msg = {username: username, result: 'success'};
        res.send(msg);
    }
    else {
        res.sendStatus(401);
    }
}

const register = async (req, res) => {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let dob = req.body.dob;
    let phone = req.body.phone;
    let zipcode = req.body.zipcode;

    // supply username and password
    if (!username || !password) {
        return res.sendStatus(400);
    }

    const user = await User.findOne({username});
    if(user) {
        return res.status(409).send("Username already taken.");
    }

    let salt = username + new Date().getTime();
    let hash = md5(salt + password) // TODO: Change this to use md5 to create a hash

    const newUser = new User({username, salt, hash});
    await newUser.save();
    // userObjs[username] =  {
    //     username: username,
    //     salt: salt,
    //     hash: hash,
    // }
    // TODO: Change this to store object with username, salt, hash

    const newProfile = new Profile({
        username: username,
        email: email,
        dob: dob,
        phone: phone,
        zipcode: zipcode,
        headline: "Not set yet"
    });
    await newProfile.save();

    let sid = crypto.randomBytes(16).toString('hex'); // CHANGE THIS!
    sessionUser[sid] = username;

    // Adding cookie for session id
    res.cookie(cookieKey, sid, {
        maxAge: 3600 * 1000,
        httpOnly: true,
        secure: true,
        sameSite: 'None'
    });

    let msg = {username: username, result: 'success'};
    res.send(msg);
}

const logout = (req, res) => {
    const sid = req.cookies[cookieKey];
    if (sid) {
        delete sessionUser[sid];
        res.clearCookie(cookieKey);
        res.sendStatus(200);

    } else {
        res.sendStatus(401);
    }
};

const user = {
    username: 'test',
    salt: 'This is my salt!',
    hash: 'This is my hash!',
}

const password = async (req, res) => {
    // let username = user.username;
    // let password = req.body.password;
    //
    // let salt = username + new Date().getTime();
    // let hash = md5(salt + password)
    //
    // user.salt = salt;
    // user.hash = hash;
    // res.send({username: username, result: 'success'});
    let username = req.username;
    let password = req.body.password;

    let salt = username + new Date().getTime();
    let hash = md5(salt + password)

    await User.updateOne({username: username}, {salt: salt, hash:hash});
    res.send({username: username, result: 'success'});
};

const getAuth = async (req, res) => {
    let user = req.params.user || req.username
    const userInfo = await User.findOne({username: user});
    if(!userInfo){
        return res.status(404).send("User info not found.");
    }
    // this return the requested user headline
    res.send({ username: user, auth: userInfo.auth, googleAuth: userInfo.googleAuth });
}


function setupRoutes(app) {
    app.post('/login', login);
    app.post('/register', register);
    app.use(isLoggedIn);
    app.put('/logout', logout);
    app.put('/password', password);
    app.get('/auth/status', getAuth);
}

module.exports = {
    setupRoutes,
    cookieKey, sessionUser,
    isLoggedIn
};
