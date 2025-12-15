const mongoose = require('mongoose');
const validator = require('validator');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    validate: {
      validator(value) {
        return validator.isEmail(value);
      },
      message: 'Email is not correct',
    },
  },
});

const User = mongoose.model('User', userSchema);

module.exports = User;
