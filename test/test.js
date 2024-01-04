const request = require("supertest")
const app = require("../index")
const mongoose = require("mongoose")
require("dotenv").config()

const demoNote = {
    "title": "Test Note 1",
    "content": "First test note"
}

let authToken
let userId
let secondaryAuthToken

const maxReq = 101

beforeAll(async () => {
    authToken = await signinUser(process.env.USER1_NAME, process.env.USER1_PASSWORD)
})

describe("Notes endpoint Test suite", () => {
    let noteId
    describe("Creates/updates new note", () => {
        it("Creates a new note when valid auth token is passed", async () => {
            const response = await request(app)
                .post("/api/notes")
                .set("Authorization", `Bearer ${authToken}`)
                .send(demoNote)
            expect(response.status).toBe(201)
            expect(response.body.message).toBe("Note created successfully")
            expect(response.body.note.title).toBe(demoNote.title)
            expect(response.body.note.content).toBe(demoNote.content)

            noteId = response.body.note._id
        })
        it("Updates title/description of the created note", async () => {
            const response = await request(app)
                .put(`/api/notes/${noteId}`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    title: "Updated Title"
                })

            expect(response.status).toBe(200)
            expect(response.body.note.title).toBe("Updated Title")
        })
    })

    describe("Retrieves notes", () => {
        it("Retrieves the created note", async () => {
            const response = await request(app)
                .get(`/api/notes/${noteId}`)
                .set("Authorization", `Bearer ${authToken}`)

            expect(response.status).toBe(200)
            expect(response.body.note.content).toBe(demoNote.content)
        })
        it("Retrieves all notes for valid user", async () => {
            const response = await request(app)
                .get(`/api/notes`)
                .set("Authorization", `Bearer ${authToken}`)

            expect(response.status).toBe(200)
            expect(response.body.created.length).toBeGreaterThanOrEqual(1);
        })
        it("Reverts when Auth token is not passed", async () => {
            const response = await request(app)
                .get(`/api/notes`)

            expect(response.status).toBe(403)
        })
    })

    describe("Sharing Notes", () => {
        it("Shares note with another user", async () => {
            userId = await signupUser(process.env.USER2_NAME, process.env.USER2_PASSWORD)
            const response = await request(app)
                .post(`/api/notes/${noteId}/share`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    id: userId
                })

            expect(response.status).toBe(200)
            expect(response.body.message).toBe("Note shared successfully")
        })
        it("Second user retrieves the shared note", async () => {
            secondaryAuthToken = await signinUser(process.env.USER2_NAME, process.env.USER2_PASSWORD)
            const response = await request(app)
                .get(`/api/notes/${noteId}`)
                .set("Authorization", `Bearer ${secondaryAuthToken}`)

            expect(response.status).toBe(200)
            expect(response.body.note.content).toBe(demoNote.content) //we updated the title in one of the previous tests
        })
        it("Reverts sharing of note when non valid mongoose user id is passed", async () => {
            const response = await request(app)
                .post(`/api/notes/${noteId}/share`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    id: "123"
                })

            // 123 is not a valid mongoose objectId, hence, it will throw an error
            // if a valid but non existing user ObjectId is passed, it will throw 404
            // with the error : 'User to share with not found'
            expect(response.status).toBe(500)
            expect(response.body.error).toBe("Internal server error occurred")
        })
        it("Reverts when invalid note id is passed", async () => {
            const response = await request(app)
                .post(`/api/notes/123/share`)
                .set("Authorization", `Bearer ${authToken}`)
                .send({
                    id: userId
                })

            // same thing -> 123 is not valid mongo id -> valid objectId (considering length and all
            // characters but few characters changed), will revert with error: Note not found
            expect(response.status).toBe(500)
            expect(response.body.error).toBe("Internal server error occurred")
        })
    })

    describe("Search querying", () => {
        it("Searches for notes using indexing and returns the result", async () => {
            const response = await request(app)
                .get('/api/notes/search')
                .set("Authorization", `Bearer ${authToken}`)
                .query({
                    q: "first"
                })

            expect(response.status).toBe(200)
            expect(response.body.results.length).toBeGreaterThanOrEqual(1);
        })
        it("Reverts search if no query param is passed", async () => {
            const response = await request(app)
                .get('/api/notes/search')
                .set("Authorization", `Bearer ${authToken}`)
            expect(response.status).toBe(400)
            expect(response.body.error).toBe("Query Parameter 'q' is required.")
        })
        it("Returns empty search result if invalid search param is passed", async () => {
            const response = await request(app)
                .get('/api/notes/search')
                .set("Authorization", `Bearer ${authToken}`)
                .query({
                    q: "random-query"
                })
            expect(response.status).toBe(200)
            expect(response.body.results.length).toBe(0)
        })
    })


})

describe('Rate Limiting', () => {
    it('Should enforce rate limiting', async () => {
        const responses = await Promise.all(
            Array.from({ length: maxReq }).map(() =>
                request(app)
                    .get('/api/notes')
                    .set('Authorization', `Bearer ${authToken}`)
            )
        )
        const lastResponse = responses[maxReq - 1]
        expect(lastResponse.status).toBe(429)
    });
});

async function signupUser(username, password) {
    const response = await request(app).post("/api/auth/signup").send({
        username: username,
        password: password
    })
    return response.body.id
}

async function signinUser(username, password) {

    const login = await request(app).post("/api/auth/login").send({
        username: username,
        password: password
    })

    jwtToken = login.body.token
    return jwtToken
}
