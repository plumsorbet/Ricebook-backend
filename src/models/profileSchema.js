const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
    },
    email: {
        type: String,
        required: [true, "Email is required"],
    },
    dob: {
        type: String,
        required: [true, "Dob is required"],
    },
    phone: {
        type: String,
        required: [true, "Phone is required"],
    },
    zipcode: {
        type: Number,
        required: [true, "Zipcode is required"],
    },
    avatar: {
        type: String,
    },
    following: {
        type: [],
    },
    headline: {
        type: String
    },
});

module.exports = profileSchema;