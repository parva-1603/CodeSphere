// Centralized API and WebSocket configuration
const isDevelopment = process.env.NODE_ENV === 'development' && window.location.port !== '5100';

export const SERVER_PORT = 5100;

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (isDevelopment 
  ? `http://${window.location.hostname}:${SERVER_PORT}`
  : window.location.origin);

export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || (isDevelopment
  ? `ws://${window.location.hostname}:${SERVER_PORT}`
  : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}`);
