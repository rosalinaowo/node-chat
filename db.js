const fs = require('fs');
const express = require('express');

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
    db.users.push(newUser);
    saveData();
    res.json(newUser);
});

app.post('/add/groupChat', (req, res) => {
    const newGroupChat = req.body;
    db.groupChats.push(newGroupChat);
    saveData();
    res.json(newGroupChat);
});

app.listen(PORT, () => {
    console.log('DB API running on http://localhost:' + PORT);
});