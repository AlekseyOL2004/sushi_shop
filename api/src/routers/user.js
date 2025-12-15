const express = require('express');
const User = require('../models/user');
const router = new express.Router();

router.post('/', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.json(user);
  } catch (error) {
    // If it's a Mongoose validation error, return the field errors
    if (error.name === 'ValidationError') {
      const details = Object.keys(error.errors).reduce((acc, key) => {
        acc[key] = error.errors[key].message;
        return acc;
      }, {});
      return res.status(400).json({ message: 'User validation failed', details });
    }

    // Fallback
    res.status(400).json({ message: error.message || 'Bad Request' });
  }
});

router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.send(error.message);
  }
});

module.exports = router;
