const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    pid: {
        type: Number,
        required: true,
        unique: true,
    },
    author: {
        type: String,
        required: true,
    },
    title: {
        type: String,
    },
    text: {
        type: String,
        required: true,
    },
    date: {
        type: Date,
        required: true,
    },
    comments: {
        type: [],
        required: true,
    },
    img: {
        type: String,
    },
})

module.exports = articleSchema;
