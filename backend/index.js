const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
require('dotenv').config();
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception (handled, not crashing):', err.message);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection (handled, not crashing):', err.message);
});
const passport = require('./config/passport');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
});

app.use(cors({
  origin: 'https://kodo-jade.vercel.app',
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/workspaces', require('./routes/workspaces'));
app.use('/api/projects', require('./routes/projects'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/snippets', require('./routes/snippets'));
app.use('/api/wiki', require('./routes/wiki'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/activity', require('./routes/activity'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/attachments', require('./routes/attachments'));

const connectedUsers = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-workspace', (workspaceId) => {
    socket.join(`workspace-${workspaceId}`);
  });

  socket.on('join-project', (projectId) => {
    socket.join(`project-${projectId}`);
  });

  socket.on('join-user', (userId) => {
    socket.join(`user-${userId}`);
  });

  socket.on('user-presence', (data) => {
    connectedUsers[socket.id] = data;
    io.to(`project-${data.projectId}`).emit('presence-update', Object.values(connectedUsers));
  });

  socket.on('task-update', (data) => {
    socket.to(`project-${data.projectId}`).emit('task-updated', data);
  });

  socket.on('typing', (data) => {
    socket.to(`project-${data.projectId}`).emit('user-typing', {
      taskId: data.taskId,
      userName: data.userName,
    });
  });

  socket.on('stop-typing', (data) => {
    socket.to(`project-${data.projectId}`).emit('user-stop-typing', {
      taskId: data.taskId,
    });
  });

  socket.on('send-notification', (data) => {
    io.to(`user-${data.userId}`).emit('new-notification', data);
  });

  socket.on('disconnect', () => {
    delete connectedUsers[socket.id];
    io.emit('presence-update', Object.values(connectedUsers));
    console.log('User disconnected:', socket.id);
  });
});

app.set('io', io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = { io };