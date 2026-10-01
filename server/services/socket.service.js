const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: '*', // For dev
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join-room', ({ roomId, user }) => {
      socket.join(roomId);
      // Notify others in room
      socket.to(roomId).emit('user-joined', { socketId: socket.id, user });
      
      // Get all clients in room
      const clients = io.sockets.adapter.rooms.get(roomId);
      const usersInRoom = Array.from(clients || []).filter(id => id !== socket.id);
      socket.emit('room-users', usersInRoom);
    });

    socket.on('leave-room', ({ roomId, user }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('user-left', { socketId: socket.id, user });
    });

    socket.on('send-message', ({ roomId, message }) => {
      io.to(roomId).emit('receive-message', message);
    });

    // WebRTC Signaling
    socket.on('signal', ({ to, signal, from, user }) => {
      io.to(to).emit('signal', { signal, from, user });
    });

    socket.on('disconnecting', () => {
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.to(room).emit('user-left', { socketId: socket.id });
        }
      }
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

const getIo = () => io;

module.exports = { initSocket, getIo };
