const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required']
  },
  salt: {
    type: String,
    required: [true, 'Salt is required']
  },
  hash: {
    type: String,
    required: [true, 'Hash is required']
  },
  auth: {
    type: Object,
    default: {},
    required: true
  },
  googleAuth: {
    type: Boolean,
    required: true,
    default: false
  },
})

module.exports = userSchema;
