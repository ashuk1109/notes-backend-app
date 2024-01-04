const express = require("express")
const bodyParser = require("body-parser")
const rateLimit = require("express-rate-limit")
const mongoose = require("mongoose")
require("dotenv").config()

async function connecToDB() {
    await mongoose.connect(process.env.MONGOOSE_URL)
}

connecToDB().catch(err => console.error(err))

const app = express()

// Middlware
app.use(bodyParser.json())

// Rate Limiting
const limitTimeInMs = 5 * 60 * 1000
const limiter = rateLimit({
    windowMs: limitTimeInMs,
    max: 100
})
app.use(limiter)

// Routes
app.use("/api/auth", require("./routes/auth"))
app.use("/api/notes", require("./routes/notes"))

app.listen(3000, () => {
    console.log("Server started, listening for requests on port 3000");
})

module.exports = app