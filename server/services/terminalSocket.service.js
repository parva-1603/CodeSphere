const { spawn } = require('child_process');
const WebSocket = require('ws');

const initTerminalSocket = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws) => {
    // Spawn PowerShell with FORCE_COLOR to encourage tools to output ANSI colors
    const shell = spawn('powershell.exe', ['-NoLogo'], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    shell.stdout.on('data', (data) => {
      ws.send(data.toString());
    });

    shell.stderr.on('data', (data) => {
      ws.send(data.toString());
    });

    ws.on('message', (msg) => {
      shell.stdin.write(msg);
    });

    ws.on('close', () => {
      shell.kill();
    });
  });

  server.on('upgrade', (request, socket, head) => {
    if (request.url === '/shell') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    }
  });
};

module.exports = { initTerminalSocket };
