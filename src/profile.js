const mongoose = require("mongoose");
const userSchema = require('./models/userSchema');
const User = mongoose.model('user', userSchema);
const profileSchema = require('./models/profileSchema');
const Profile = mongoose.model('profile', profileSchema);
const uploadImage = require('./uploadCloudinary')

const connectionString = 'mongodb+srv://username:88888888@cluster0.tcvla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connector = mongoose.connect(connectionString);

const getHeadline = async (req, res) => {
    let user = req.params.user || req.username
    const userProfile = await Profile.findOne({username: user});
    if(!userProfile){
        return res.status(404).send("User profile not found.");
    }
    // this return the requested user headline
    res.send({ username: user, headline: userProfile.headline });
}

const setHeadline = async (req, res) => {
    const user = req.username;
    const newHeadline = req.body.headline;
    if(!newHeadline){
        return res.status(400).send("Headline is required.");
    }

    const newUserProfile = await Profile.findOneAndUpdate(
        {username: user},
        {headline: newHeadline},
        {new: true}
    )
    if(!newUserProfile){
        return res.status(404).send("User not found.");
    }

    res.send({username: user, headline: newUserProfile.headline});
}

const getEmail = async (req, res) => {
    const user = req.params.user || req.username;
    const userProfile = await Profile.findOne({username: user});
    if(!userProfile){
        return res.status(404).send("User not found.");
    }
    // this return the requested user headline
    res.send({ username: user, email: userProfile.email });
}

const setEmail = async (req, res) => {
    const user = req.username;
    const newEmail = req.body.email;
    if(!newEmail){
        return res.status(400).send("Email is required.");
    }

    const newUserProfile = await Profile.findOneAndUpdate(
        {username: user},
        {email: newEmail},
        {new: true}
    )
    if(!newUserProfile){
        return res.status(404).send("User not found.");
    }

    res.send({username: user, email: newUserProfile.email});
}

const getDob = async (req, res) => {
    const user = req.params.user || req.username;
    const userProfile = await Profile.findOne({username: user});
    if(!userProfile){
        return res.status(404).send("User not found.");
    }
    // this return the requested user headline
    res.send({ username: user, dob: userProfile.dob });
}

const getZipcode = async (req, res) => {
    const user = req.params.user || req.username;
    const userProfile = await Profile.findOne({username: user});
    if(!userProfile){
        return res.status(404).send("User not found.");
    }
    // this return the requested user headline
    res.send({ username: user, zipcode: userProfile.zipcode });
}

const setZipcode = async (req, res) => {
    const user = req.username;
    const newZipcode = req.body.zipcode;
    if(!newZipcode){
        return res.status(400).send("Zipcode is required.");
    }

    const newUserProfile = await Profile.findOneAndUpdate(
        {username: user},
        {zipcode: newZipcode},
        {new: true}
    )
    if(!newUserProfile){
        return res.status(404).send("User not found.");
    }

    res.send({username: user, zipcode: newUserProfile.zipcode});
}

const getPhone = async (req, res) => {
    const user = req.params.user || req.username;
    const userProfile = await Profile.findOne({username: user});
    if(!userProfile){
        return res.status(404).send("User not found.");
    }
    // this return the requested user headline
    res.send({ username: user, phone: userProfile.phone });
}

const setPhone = async (req, res) => {
    const user = req.username;
    const newPhone = req.body.phone;
    if(!newPhone){
        return res.status(400).send("Phone is required.");
    }

    const newUserProfile = await Profile.findOneAndUpdate(
        {username: user},
        {phone: newPhone},
        {new: true}
    )
    if(!newUserProfile){
        return res.status(404).send("User not found.");
    }

    res.send({username: user, phone: newUserProfile.phone});
}

const getAvatar = async (req, res) => {
    const user = req.params.user || req.username;
    const userProfile = await Profile.findOne({ username: user });

    if (!userProfile) {
        return res.status(404).send('User not found.');
    }
    if(!userProfile.avatar){
        userProfile.avatar = null;
    }
    res.send({ username: user, avatar: userProfile.avatar });
};

const setAvatar = async (req, res) => {
    const user = req.username;
    const newAvatar = req.fileurl;

    if (!newAvatar) {
        return res.status(400).send('Avatar file is required.');
    }

    const newAvatarHttps = newAvatar.replace('http://', 'https://');

    try {
        const updatedUserProfile = await Profile.findOneAndUpdate(
            { username: user },
            { avatar: newAvatarHttps },
            { new: true }
        );

        if (!updatedUserProfile) {
            return res.status(404).send('User not found.');
        }

        res.send({ username: user, avatar: updatedUserProfile.avatar });
    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to update avatar.');
    }
};

module.exports = (app) => {
    app.get('/headline/:user?', getHeadline);
    app.put('/headline', setHeadline);
    app.get("/email/:user?", getEmail);
    app.put("/email", setEmail);
    app.get("/dob/:user?", getDob);
    app.get("/zipcode/:user?", getZipcode);
    app.put("/zipcode", setZipcode);
    app.get('/phone/:user?', getPhone);
    app.put('/phone', setPhone);
    app.get('/avatar/:user?', getAvatar);
    app.put('/avatar', uploadImage('avatar'), setAvatar)
}