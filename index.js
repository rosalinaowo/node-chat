const express = require('express')
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const PORT = 3000;
const app = express();
const server = createServer(app);
const io = new Server(server);
const users = new Map();

app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
});

io.on('connection', (socket) => {
    console.log('A user connected');

    socket.on('register', (uuid) => {
        users.set(uuid, socket.id);
        console.log(`User ${uuid} registered with socket id ${socket.id}`);
    });

    socket.on('message', (data) => {
        const { uuid, recipientUuid, firstName, lastName, time, text} = data;

        const recipientSocketId = users.get(recipientUuid);
        if (recipientSocketId) {
            io.to(recipientSocketId).emit('message', { uuid, firstName, lastName, text });
            console.log(`User ${uuid} sent a message to ${recipientUuid}`);
        } else {
            socket.emit('error', { message: `User ${recipientUuid} not connected` });
            console.error(`ERROR: Not connected - User ${uuid} tried to send a message to ${recipientUuid}`);
        }
    });

    socket.on('disconnect', () => {
        for (const [uuid, socketId] of users.entries()) {
            if (socketId === socket.id) {
                users.delete(uuid);
                console.log(`User ${uuid} disconnected`);
                break;
            }
        }
    });
});

server.listen(PORT, () => {
    console.log('Server running on port http://localhost:' + PORT);
});