const fs = require('fs');
const express = require('express');
const Joi = require('joi');

// Schemas
const userSchema = Joi.object({
    uuid: Joi.string().guid({ version: 'uuidv4' }).required(),
    firstName: Joi.string().min(1).required(),
    lastName: Joi.string().min(1).required(),
    lastSeen: Joi.date().timestamp('javascript'),
    pfpUrl: Joi.string(),
    contacts: Joi.array().items(Joi.string().guid({ version: 'uuidv4' })).required()
});

const PORT = 3001;
const app = express();
const dbPath = './db.json';

function getData() {
    return JSON.parse(fs.readFileSync(dbPath));
}

function saveData() {
    fs.writeFile(dbPath, JSON.stringify(db, null, 2), (err) => {
        if (err) console.error(err);
    });
}

let db = getData();

app.use(express.json());

app.get('/get/users', (req, res) => {
    res.json(db.users);
});

app.post('/get/user', (req, res) => {
    const uuid = req.body.uuid;
    res.json(db.users.find((user) => user.uuid === uuid));
});

app.post('/get/groupChat', (req, res) => {
    const uuid = req.body.uuid;
    res.json(db.groupChats.find((groupChat) => groupChat.uuid === uuid));
});

app.post('/add/user', (req, res) => {
    const newUser = req.body;
    const validationResult = userSchema.validate(newUser);
    if (validationResult.error) {
        res.json({ "status": "error", "description": "Invalid user provided" });
    } else {
        db.users.push(newUser);
        saveData();
        res.json({ "status": "success", "user": newUser });
    }
});

app.post('/add/groupChat', (req, res) => {
    const newGroupChat = req.body;
    db.groupChats.push(newGroupChat);

    saveData();
    res.json(newGroupChat);
});

app.put('/edit/user', (req, res) => {
    if (req.body.uuid) {
        const uuid = req.body.uuid;
        const index = db.users.findIndex((user) => user.uuid === uuid);
        if (index >= 0) {
            const updatedUser = { ...db.users[index], ...req.body }
            db.users[index] = updatedUser;

            saveData();
            res.json({ "status": "success", "user": updatedUser });
        } else {
            res.json({ "status": "error", "description": `No user found with UUID: ${uuid}` });
        }
    } else {
        res.json({ "status": "error", "description": "UUID not provided" });
    }
});

app.delete('/delete/user', (req, res) => {
    if (req.body.uuid) {
        const uuid = req.body.uuid;
        const index = db.users.findIndex((user) => user.uuid === uuid);
        if (index >= 0) {
            db.users.splice(index, 1);
            
            saveData();
            res.json({ "status": "success" });
        } else {
            res.json({ "status": "error", "description": `No user found with UUID: ${uuid}` });
        }
    } else {
        res.json({ "status": "error", "description": "UUID not provided" });
    }
});

app.listen(PORT, () => {
    console.log('DB API running on http://localhost:' + PORT);
});