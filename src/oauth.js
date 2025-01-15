const express = require('express');
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const mongoose = require("mongoose");
const userSchema = require('./models/userSchema');
const User = mongoose.model('user', userSchema);
const profileSchema = require('./models/profileSchema');
const Profile = mongoose.model('profile', profileSchema);
const articleSchema = require('./models/articleSchema');
const Article = mongoose.model('article', articleSchema);

const { isLoggedIn, cookieKey, sessionUser} = require('./auth');
const crypto = require('crypto');
const md5 = require("md5");

require('dotenv').config();


passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(async function(id, done) {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

async function generateUniqueUsername(username) {
    let uniqueUsername = username;
    let index = 1;

    while (await User.findOne({ username: uniqueUsername })) {
        uniqueUsername = username + '_' + index;
        index++;
    }

    return uniqueUsername;
}

passport.use(new GoogleStrategy({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: "https://ricesocialmedia-89d5147d4bd0.herokuapp.com/auth/google/callback"
        },
        async function(accessToken, refreshToken, profile, done) {
            // let user = {
            //     /*'email': profile.emails[0].value,
            //     'name' : profile.name.givenName + ' ' + profile.name.familyName,
            //     'id'   : profile.id,*/
            //     'token': accessToken
            // };
            try{
                console.log('sessionUser:', sessionUser);
                console.log('cookieKey:', cookieKey);

                const email = profile.emails[0].value;
                const googleId = profile.id;
                let user = await User.findOne({ $or: [{ email }, { 'auth.google': googleId }] });
                console.log("user 1st: ", user);
                if(!user){
                    // If no user, create a new one
                    let username = profile.displayName;
                    let uniqueUsername = await generateUniqueUsername(username);

                    let salt = uniqueUsername + new Date().getTime();
                    let hash = md5(salt + "111111")

                    user = new User({
                        username: uniqueUsername,
                        salt,
                        hash,
                        auth: { google: googleId },
                        googleAuth: true
                    });
                    let newProfile = new Profile({
                        username: uniqueUsername,
                        email: profile.emails[0].value,
                        phone: "000-000-0000",
                        zipcode: "12345",
                        dob: "2000-01-01",
                        avatar: profile.photos[0].value,
                        headline: "google auth user"
                    });
                    console.log("user: ", user);
                    console.log("newProfile: ", newProfile);
                    await user.save();
                    await newProfile.save();
                } else if (!user.auth.google) {
                    user.auth.google = googleId;
                    await user.save();
                }
                return done(null, user);
            }catch(error){
                return done(error, null);
            }

            // You can perform any necessary actions with your user at this point,
            // e.g. internal verification against a users table,
            // creating new user entries, etc.

            // return done(null, user);

            // User.findOrCreate(..., function(err, user) {
            //     if (err) { return done(err); }
            //     done(null, user);
            // });
        })
);

async function mergeUserData(mainUser, oldUser) {
    try {
        const mainUsername = mainUser.username;
        const oldUsername = oldUser.username;

        // 1. 合并关注者列表 (followers)
        const mainProfile = await Profile.findOne({ username: mainUsername });
        const oldProfile = await Profile.findOne({ username: oldUsername });

        const uniqueFollowers = new Set([...(mainProfile.following || []), ...(oldProfile.following || [])]);
        mainProfile.following = Array.from(uniqueFollowers);

        // 2. 将文章的 author 字段从 oldUser 替换为 mainUser
        await Article.updateMany(
            { author: oldUsername },
            { $set: { author: mainUsername } }
        );

        // 3. 更新文章中评论的作者
        await Article.updateMany(
            { 'comments.author': oldUsername }, // 找到评论的作者是 oldUser 的
            { $set: { 'comments.$[elem].author': mainUsername } }, // 更新评论的作者
            { arrayFilters: [{ 'elem.author': oldUsername }] } // 指定数组过滤器，仅更改 author 是 oldUsername 的评论
        );

        // 4. 这里可以合并其他数据

        // 5. 保存更新后的 mainUser 并删除 oldUser
        // await mainUser.save();
        await mainProfile.save();
        await User.deleteOne({ _id: oldUser._id });
        await Profile.deleteOne({username: oldUsername})

        console.log(`Successfully merged user ${oldUsername} into ${mainUsername}`);
    } catch (error) {
        console.error('Error merging user data:', error);
    }
}

module.exports = (app) => {
    // Redirect the user to Google for authentication.  When complete,
    // Google will redirect the user back to the application at
    //     /auth/google/callback
    app.get('/auth/google', passport.authenticate('google',{
        scope: ['https://www.googleapis.com/auth/plus.login', "email", "profile"], state: 'login'
    })); // could have a passport auth second arg {scope: 'email'}

    // Google will redirect the user to this URL after approval.  Finish the
    // authentication process by attempting to obtain an access token.  If
    // access was granted, the user will be logged in.  Otherwise,
    // authentication has failed.
    app.get('/auth/google/callback', (req, res, next) => {
            if (req.query.state === 'link') {
                // 在需要的情况下调用 isLoggedIn
                return isLoggedIn(req, res, next);
            } else {
                // 否则直接进入 passport.authenticate 处理
                next();
            }
        },
        passport.authenticate('google', {
            failureRedirect: 'https://social-media-frontend.surge.sh' }),
        async (req, res) =>{
            const state = req.query.state;
            console.log('State from query:', state);

            if (state === 'link') {
                const googleId = req.user.auth.google;
                const loggedInUsername = req.username;
                console.log("loggedInUsername: ", loggedInUsername)
                let currentUser = await User.findOne({ username: loggedInUsername });

                const linkedUser = await User.findOne({ 'auth.google': googleId });
                console.log("currentUser",currentUser);
                console.log("linkedUser",linkedUser)

                if (linkedUser && linkedUser._id.toString() !== currentUser._id.toString()) {
                    // 合并账户：将 Google 账户绑定到当前账户
                    console.log("合并账户：将 Google 账户绑定到当前账户")
                    currentUser.markModified('auth');
                    currentUser.auth.google = googleId;
                    await currentUser.save();

                    // 合并数据：例如合并关注者列表
                    await mergeUserData(currentUser, linkedUser);

                    // 删除多余的 Google 账户用户
                    await User.deleteOne({ _id: linkedUser._id });
                    await Profile.deleteOne({username: linkedUser.username});
                } else if (!currentUser.auth.google) {
                    // 如果当前账户没有绑定 Google 账户，直接绑定
                    console.log("如果当前账户没有绑定 Google 账户，直接绑定")
                    currentUser.auth.google = googleId;
                    currentUser.markModified('auth');
                    console.log("currentUser: ",currentUser)
                    await currentUser.save();
                }

                res.redirect('https://social-media-frontend.surge.sh/profile');
                // res.redirect('http://localhost:3001/profile');
            } else {
                if (req.user) {
                    let sid = crypto.randomBytes(16).toString('hex');
                    sessionUser[sid] = req.user.username;
                    res.cookie(cookieKey, sid, {
                        maxAge: 3600 * 1000,
                        httpOnly: true,
                        secure: true,
                        sameSite: 'None'
                    });
                    res.redirect('https://social-media-frontend.surge.sh/google-auth');
                    // res.redirect('http://localhost:3001/google-auth');
                } else {
                    res.redirect('https://social-media-frontend.surge.sh');
                    // res.redirect('http://localhost:3001');
                }
            }
        });

    app.get('/auth/google/username',
        (req, res) => {
            if(req.user){
                res.send({ result: "success", username: req.user.username });
            }else{
                res.sendStatus(401);
            }
        })

    app.get('/auth/google/link', isLoggedIn,
        passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login', 'email', 'profile'],
            state: "link"
        })
    );

    app.post('/auth/google/unlink', isLoggedIn, async (req, res) => {
        try {
            console.log("req.username", req.username)
            const currentUser = await User.findOne({username: req.username});
            if (currentUser && currentUser.auth.google) {
                // 从 auth 字段中删除 Google 绑定信息
                delete currentUser.auth.google;
                currentUser.markModified('auth');
                await currentUser.save();
                console.log("currentUser.auth.google", currentUser.auth.google)
                res.json({ message: 'Successfully unlink Google Account' });
            } else {
                res.status(400).json({ message: 'Current user has not linked Google account' });
            }
        } catch (error) {
            res.status(500).json({ message: 'Unlink account error', error });
        }
    });

};