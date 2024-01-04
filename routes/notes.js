const express = require('express');
const router = express.Router();

const Note = require("../models/Note")
const User = require("../models/User")
const authenticateMiddleWare = require('../middlewares/authenticateUser');
const { search } = require('..');

router.use(authenticateMiddleWare)

// @desc search a note using indexing
router.get('/search', async (req, res) => {
    const query = req.query.q
    if (!query) {
        return res.status(400).json({
            error: "Query Parameter 'q' is required."
        })
    }

    try {
        const results = await Note.find({
            $text: {
                $search: query
            }
        })
        res.status(200).json({ results })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error occurred"
        })
    }
});

// @desc Get all notes of user
router.get('/', async (req, res) => {
    try {
        const notes = await Note.find({ author: req.user._id });
        const sharedNotes = await Note.find({
            sharedWith: {
                $in: [req.user._id]
            }
        })
        res.status(200).json({
            created: notes,
            sharedWithYou: sharedNotes
        });
    } catch (error) {
        res.status(500).json({
            error: "Internal Server error occurred"
        })
    }
});

// @desc Get a note by ID
router.get('/:id', async (req, res) => {
    try {
        const noteId = req.params.id
        const note = await Note.findOne({
            _id: noteId,
            $or: [
                { author: req.user._id },
                {
                    sharedWith: {
                        $in: [req.user._id]
                    }
                }
            ]
        });

        if (!note) {
            return res.status(404).json({
                error: "Note not found"
            })
        }
        res.status(200).json({ note });
    } catch (error) {
        res.status(500).json({
            error: "Internal server error occurred"
        })
    }

});

// @desc Create a new note
router.post('/', async (req, res) => {
    const { title, content } = req.body

    try {
        const note = await Note.create({
            title: title,
            content: content,
            author: req.user._id
        })
        res.status(201).json({
            message: "Note created successfully",
            note: note
        })

    } catch (error) {
        res.status(500).json({
            error: "Internal server error occurred"
        })
    }
});

// @desc Update a note
router.put('/:id', async (req, res) => {
    const noteId = req.params.id
    const body = req.body

    try {
        const note = await Note.findOne({
            _id: noteId,
            author: req.user._id
        })

        if (!note) {
            return res.status(404).json({
                error: "Note not found"
            })
        }

        note.title = body.title ? body.title : note.title
        note.content = body.content ? body.content : note.content
        await note.save()
        res.status(200).json({
            message: "Note updated successfully",
            note: note
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error occurred"
        })
    }
});

// @desc Delete a note
router.delete('/:id', async (req, res) => {
    const noteId = req.params.id

    try {
        const note = await Note.findOneAndDelete({
            _id: noteId,
            author: req.user._id
        })
        if (!note) {
            return res.status(404).json({
                error: "Note not found"
            })
        }

        res.status(200).json({
            message: "Note deleted successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error occurred"
        })
    }
});

// @desc Share a note with another user
router.post('/:id/share', async (req, res) => {
    const noteId = req.params.id
    const userToShareWithId = req.body.id

    try {
        const note = await Note.findOne({
            _id: noteId,
            author: req.user._id
        })
        if (!note) {
            return res.status(404).json({
                error: "Note not found"
            })
        }

        const userToShareWith = await User.findById(userToShareWithId)

        if (!userToShareWith) {
            return res.status(404).send({ error: 'User to share with not found' });
        }

        note.sharedWith = note.sharedWith || []

        if (note.sharedWith.includes(userToShareWithId)) {
            return res.status(400).json({
                error: "Note is already shared with this user"
            })
        }

        note.sharedWith.push(userToShareWithId);
        await note.save();

        res.status(200).json({
            message: "Note shared successfully"
        })
    } catch (error) {
        res.status(500).json({
            error: "Internal server error occurred"
        })
    }
});

module.exports = router;
