require('dotenv').config({ path: require('fs').existsSync('../.env') ? '../.env' : '../.env.example' });
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
app.use(cors());
app.use(express.json());

// Init services
initSocket(server);
initYjs(server);
initTerminalSocket(server);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/projects', require('./routes/project.routes'));
app.use('/api/ai', require('./routes/ai.routes'));
app.use('/api/github', require('./routes/github.routes'));
app.use('/api/terminal', require('./routes/terminal.routes'));
app.use('/api/run', require('./routes/run.routes'));

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
