const path = require('path');
const fs = require('fs');

if (fs.existsSync(path.join(__dirname, '.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '.env') });
} else if (fs.existsSync(path.join(__dirname, '../.env'))) {
  require('dotenv').config({ path: path.join(__dirname, '../.env') });
} else {
  require('dotenv').config({ path: path.join(__dirname, '../.env.example') });
}

const express = require('express');
const http = require('http');
const cors = require('cors');
const connectDB = require('./config/db');
const { initSocket } = require('./services/socket.service');
const { initYjs } = require('./services/yjs.service');
const { initTerminalSocket } = require('./services/terminalSocket.service');

const app = express();
const server = http.createServer(app);

// Connect Database
connectDB();

// Middleware
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const clean = origin.replace(/\/$/, '');
    if (
      clean.endsWith('.vercel.app') || 
      clean.includes('localhost') || 
      clean.includes('127.0.0.1') ||
      (process.env.CLIENT_URL && clean === process.env.CLIENT_URL.replace(/\/$/, ''))
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint for Render / monitoring
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', time: new Date().toISOString() }));
app.get('/', (req, res) => res.status(200).json({ message: 'CodeSphere API is running' }));

// Init services
initSocket(server);
initYjs(server);
initTerminalSocket(server);

// API Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/github', require('./routes/github.routes'));
app.use('/api/terminal', require('./routes/terminal.routes'));
app.use('/api/run', require('./routes/run.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/admin', require('./routes/admin.routes'));

// Serve React static build files if they exist (Single-Port Production Mode)
const buildPath = path.join(__dirname, '../client/build');
if (fs.existsSync(buildPath)) {
  app.use(express.static(buildPath));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(buildPath, 'index.html'));
  });
}

const PORT = process.env.PORT || 5100;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

