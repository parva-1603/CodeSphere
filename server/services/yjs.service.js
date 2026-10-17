const { setupWSConnection } = require('y-websocket/bin/utils');
const WebSocket = require('ws');

const initYjs = (server) => {
  const wss = new WebSocket.Server({ 
    noServer: true,
    maxPayload: 100 * 1024 * 1024 
  });

  wss.on('error', (err) => {
    console.warn('[Yjs WSS Error]:', err.message);
  });

  wss.on('connection', (conn, req, { docName }) => {
    conn.on('error', (err) => {
      console.warn(`[Yjs WS Error in ${docName}]:`, err.message);
    });
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
