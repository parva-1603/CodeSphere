const { setupWSConnection } = require('y-websocket/bin/utils');
const WebSocket = require('ws');

const initYjs = (server) => {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (conn, req, { docName }) => {
    setupWSConnection(conn, req, { docName });
  });

  server.on('upgrade', (request, socket, head) => {
    // Only handle /yjs/* routes
    if (request.url.startsWith('/yjs/')) {
      // url might be /yjs/roomId
      const docName = request.url.split('/')[2];
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, { docName });
      });
    }
  });
};

module.exports = { initYjs };
