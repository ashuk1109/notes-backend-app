const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken")

const User = require('../models/User');

// @desc Register new user
router.post('/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const newUser = await User.create({
        username,
        password
    })

    res.json({
        message: "User signed up successfully!!",
        id: newUser._id
    })

});

// @desc Login user and return JWT token
router.post('/login', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;

    const userFound = await User.find({
        username,
        password
    })

    if (!userFound) {
        return res.status(411).json({
            message: 'Incorrect credentials'
        })
    }

    const token = jwt.sign(
        { username },
        process.env.JWT_SECRET,
        { expiresIn: '5d' }
    )

    res.status(200).json({ token });

});

module.exports = router;
