const jwt = require("jsonwebtoken")

const User = require("../models/User")

async function authenticateUser(req, res, next) {
    try {
        const token = req.headers.authorization.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ username: decoded.username });
        if (decoded.username) {
            req.user = user
            next();
        } else {
            res.status(403).json({
                message: "Unauthorized access"
            })
        }
    } catch (error) {
        res.status(403).json({
            message: "Unauthorized access"
        })
    }
}

module.exports = authenticateUser