const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const axios = require('axios');
const Joi = require('joi');

const messageSchema = Joi.object({
    senderUuid: Joi.string().guid({ version: 'uuidv4' }).required(),
    recipientUuid: Joi.string().guid({ version: 'uuidv4' }).required(),
    time: Joi.date().timestamp('javascript').required(),
    text: Joi.string().min(1).required()
});

const PORT = 3000;
const API_ENDPOINT = 'http://localhost:3001';
const app = express();
const server = createServer(app);
const io = new Server(server);
const connectedUsers = new Map();
const opts = { headers: { 'Content-Type': 'application/json' } };

async function getUser(uuid) {
    return await axios.post(
        API_ENDPOINT + '/get/user',
        {
            uuid: uuid
        },
        opts
    );
}

async function updateUser(user) {
    return await axios.put(
        API_ENDPOINT + '/edit/user',
        user,
        opts
    );
}

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log(`[C] ${socket.id}`);

    socket.on('register', async (user) => {
        const res = await axios.post(
            API_ENDPOINT + '/add/user',
            user,
            opts
        );

        if (res.data.status === 'success') {
            console.log(`[R] ${res.data.user.firstName} ${res.data.user.lastName} (${res.data.user.uuid}) [${socket.id}]`);
        } else {
            console.log(`![R] ${socket.id}`);
        }
        socket.emit('registrationStatus', res.data);
    });

    socket.on('login', async (uuid) => {
        const res = await getUser(uuid);
        if (res.data !== '') {
            connectedUsers.set(uuid, socket.id);
            socket.emit('loginStatus', { status: 'success', requestedUuid: uuid, profile: res.data });
            console.log(`[+] ${res.data.firstName} ${res.data.lastName} (${uuid}) [${socket.id}]`);
        } else {
            socket.emit('loginStatus', { status: 'error', description: `Couldn't find user with UUID: ${uuid}`, requestedUuid: uuid });
        }
    });

    socket.on('message', (msg) => {
        const validationResult = messageSchema.validate(msg);

        if (validationResult.error) {
            socket.emit('sendMessageStatus', { status: 'error', description: validationResult.error.details[0].message });
        } else {
            const recipientSocketId = connectedUsers.get(msg.recipientUuid);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('message', msg);
                console.log(`[MSG] ${msg.senderUuid} -> ${msg.recipientUuid}`);
            } else {
                socket.emit('sendMessageStatus', { status: 'error', description: `User ${msg.recipientUuid} not connected` });
                console.error(`![MSG] ${msg.senderUuid} -> ${msg.recipientUuid}`);
            }
        }
    });

    socket.on('disconnect', async () => {
        for (const [uuid, socketId] of connectedUsers.entries()) {
            if (socketId === socket.id) {
                const res = await getUser(uuid);

                updateUser({ uuid: res.data.uuid, lastSeen: Date.now() });

                connectedUsers.delete(uuid);
                console.log(`[-] ${res.data.firstName} ${res.data.lastName} (${uuid}) [${socket.id}]`);
                break;
            }
        }
    });

    socket.on('getUser', async (uuid) => {
        const res = await getUser(uuid);
        socket.emit('getUserResult', res.data);
    });
});

server.listen(PORT, () => {
    console.log('Frontend running on http://localhost:' + PORT);
});