const mongoose = require("mongoose");
const userSchema = require('./models/userSchema');
const User = mongoose.model('user', userSchema);
const profileSchema = require('./models/profileSchema');
const Profile = mongoose.model('profile', profileSchema);
const articleSchema = require('./models/articleSchema');
const uploadImage = require("./uploadCloudinary");
const Article = mongoose.model('article', articleSchema);

const connectionString = 'mongodb+srv://username:88888888@cluster0.tcvla.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const connector = mongoose.connect(connectionString);

const getArticles = async (req, res) =>{
    let username = req.username;
    let id = req.params.id;

    let articles;

    if(id){
        const queryKey = isNaN(id)? 'author' : 'pid';
        articles = await Article.find({[queryKey]: id});
    }else{
        const userProfile = await Profile.findOne({username: username});
        if(!userProfile){
            return res.sendStatus(404);
        }
        articles = await Article.find({
            author: { $in: [username, ...userProfile.following] }
        }).sort({ date: -1 });
    }
    res.send({articles: articles});
};

const updateArticles = async (req, res) => {
    let username = req.username;
    let pid = req.params.id;
    let text = req.body.text;
    let commentId = req.body.commentId;

    let article = await Article.findOne({pid: pid});
    if(!article){
        return res.status(404).send("Article not found.");
    }
    // if(article.author !== username){
    //     return res.status(403).send("You are not allowed to edit this article.");
    // }
    if(!text){
        return res.status(400).send("Text is required.");
    }

    if (commentId === undefined) {
        article.text = text;
    } else if (commentId === -1) {
        const newCommentId = Date.now();
        article.comments.push({ commentId: newCommentId, comment: text, author: username });
    } else {
        const curComment = article.comments.find((c) => c.commentId === commentId);

        if (curComment) {
            if (curComment.author !== username) {
                return res.status(403).send("You are not allowed to edit this comment.");
            }
            curComment.comment = text;
            article.markModified('comments');
        } else {
            return res.status(404).send("Comment not found.");
        }
    }

    await article.save();
    const articles = await Article.find().sort({ date: -1 });
    res.send({articles});
}

const postArticle = async (req, res) => {
    let username = req.username;
    let title = req.body.title;
    let text = req.body.text;

    if(!text){
        return res.status(400).send("Article text are required.");
    }

    // img file
    let img = null;
    if (req.fileurl) {
        img = req.fileurl.replace('http://', 'https://');
    }

    const newArticle = new Article({
        pid: Date.now(),
        author: username,
        title: title,
        text: text,
        date: new Date(),
        img,
        comments: []
    });
    await newArticle.save();
    const articles = await Article.find().sort({ date: -1 });
    res.send({articles});
}

module.exports = (app) => {
    app.get("/articles/:id?", getArticles);
    app.put("/articles/:id", updateArticles);
    app.post("/article", uploadImage('article'), postArticle);
}