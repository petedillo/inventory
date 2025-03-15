const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const passport = require('passport');
const db = require('../models');
const { initializePassport } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
initializePassport();
app.use(passport.initialize());

// Socket.io connection
io.on('connection', (socket) => {
  console.log('New client connected');
  
  // Join a room for a specific user's inventory
  socket.on('subscribeToInventory', (userId) => {
    socket.join(`inventory-${userId}`);
    console.log(`Client subscribed to inventory updates for user ${userId}`);
  });
  
  // Leave a room
  socket.on('unsubscribeFromInventory', (userId) => {
    socket.leave(`inventory-${userId}`);
    console.log(`Client unsubscribed from inventory updates for user ${userId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Make io accessible to our routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

const routes = require('./routes/index');
app.use('/', routes);

// Sync database and start server
db.sequelize.sync().then(() => {
  server.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
});