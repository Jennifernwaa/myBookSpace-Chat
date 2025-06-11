const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: 'https://get-nerdy-book-web.vercel.app',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3700;

const cors = require('cors');

app.use(cors({
  origin: ['https://get-nerdy-book-web.vercel.app'], // ✅ Replace with your actual Vercel site
  methods: ['GET', 'POST'],
  credentials: true
}));


const users = {}; // { username: socket.id }

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

io.on('connection', (socket) => {
  let currentUser = '';

  socket.on('register', (username) => {
    currentUser = username;
    users[username] = socket.id;
    io.emit('userList', Object.keys(users));
    socket.emit('message', { username: 'Server', message: 'Welcome to the chat!' });
  });

  socket.on('send', (data) => {
    const { message, username, to } = data;
    if (to && users[to]) {
        // Send to recipient
        io.to(users[to]).emit('private', { from: username, message });
        // Send to sender too
        socket.emit('private', { from: username, message });
    } else {
        io.emit('message', { username, message });
    }
    });


  socket.on('disconnect', () => {
    if (currentUser) {
      delete users[currentUser];
      io.emit('userList', Object.keys(users));
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
