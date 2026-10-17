const { spawn } = require('child_process');
const WebSocket = require('ws');

const initTerminalSocket = (server) => {
  const wss = new WebSocket.Server({ 
    noServer: true,
    maxPayload: 100 * 1024 * 1024 
  });

  wss.on('error', (err) => {
    console.warn('[Terminal WSS Error]:', err.message);
  });

  wss.on('connection', (ws) => {
    ws.on('error', (err) => {
      console.warn('[Terminal WS Client Error]:', err.message);
    });

    // Spawn PowerShell with FORCE_COLOR to encourage tools to output ANSI colors
    const shell = spawn('powershell.exe', ['-NoLogo'], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '1' }
    });

    shell.stdout.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    shell.stderr.on('data', (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(data.toString());
      }
    });

    ws.on('message', (msg) => {
      try {
        shell.stdin.write(msg);
      } catch (err) {
        console.warn('[Terminal Stdin Error]:', err.message);
      }
    });

    ws.on('close', () => {
      try {
        shell.kill();
      } catch (e) {}
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
