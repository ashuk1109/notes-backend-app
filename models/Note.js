const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema({
    title: String,
    content: String,
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    sharedWith: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    searchText: String
})

noteSchema.pre("save", function (next) {
    this.searchText = `${this.title} ${this.content}`
    next()
})

noteSchema.index({ searchText: "text" })

const noteModel = mongoose.model("Note", noteSchema);
module.exports = noteModel