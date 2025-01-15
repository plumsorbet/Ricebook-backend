const mongoose = require("mongoose");
const userSchema = require('./models/userSchema');
const User = mongoose.model('user', userSchema);
const profileSchema = require('./models/profileSchema');
const Profile = mongoose.model('profile', profileSchema);

const connectionString = 'mongodb+srv://username:88888888@cluster0.tcvla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connector = mongoose.connect(connectionString);

const getFollowing = async (req, res) =>{
    const username = req.params.user || req.username;
    const userProfile = await Profile.findOne({username: username});
    if(!userProfile){
        return res.status(404).json({ message: "Username does not exist." });
    }

    const following = userProfile.following;
    const followingProfiles = await Profile.find({
        username: { $in: following }
    });
    res.send({username: username, following: following, followingProfiles: followingProfiles});
}

const addFollowing = async (req, res) => {
    const loggedInUser = req.username;
    const user = req.params.user;

    const userToFollow = await User.findOne({username: user});
    if(!userToFollow){
        return res.status(404).send("Username does not exist.");
    }
    if(userToFollow.username === loggedInUser){
        return res.status(404).send("You can't follow yourself.");
    }

    const loggedInUserProfile = await Profile.findOne({username: loggedInUser});
    if(loggedInUserProfile.following.includes(user)){
        return res.status(409).send("You already followed this user.");
    }

    loggedInUserProfile.following.push(user);
    await loggedInUserProfile.save();

    const followingProfiles = await Profile.find({
        username: { $in: loggedInUserProfile.following }
    });

    res.send({username: loggedInUser, following: loggedInUserProfile.following, followingProfiles: followingProfiles});
}

const deleteFollowing = async (req, res) => {
    const loggedInUser = req.username;
    const user = req.params.user;

    const userToUnfollow = await User.findOne({username: user});
    if(!userToUnfollow){
        return res.status(404).send("Username does not exist.");
    }

    const loggedInUserProfile = await Profile.findOne({username: loggedInUser});
    if(!loggedInUserProfile.following.includes(user)){
        return res.status(409).send("You haven't followed this user.");
    }

    loggedInUserProfile.following.pull(user);
    await loggedInUserProfile.save();

    const followingProfiles = await Profile.find({
        username: { $in: loggedInUserProfile.following }
    });

    res.send({username: loggedInUser, following: loggedInUserProfile.following, followingProfiles: followingProfiles});
}

module.exports = (app) => {
    app.get("/following/:user?", getFollowing);
    app.put("/following/:user", addFollowing);
    app.delete("/following/:user", deleteFollowing);
}