// Centralized API and WebSocket configuration
const isLocalhost = typeof window !== 'undefined' && Boolean(
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname === '[::1]'
);

const isDevelopment = process.env.NODE_ENV === 'development' || isLocalhost;

export const SERVER_PORT = 5100;

// In production on Vercel, REACT_APP_API_BASE_URL MUST be set in Vercel environment variables.
if (process.env.NODE_ENV === 'production' && !isLocalhost && !process.env.REACT_APP_API_BASE_URL) {
  console.error(
    '[CodeSphere] REACT_APP_API_BASE_URL is not set! ' +
    'API calls will fail on Vercel. Set it in Vercel → Settings → Environment Variables.'
  );
}

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (isDevelopment 
  ? (typeof window !== 'undefined' ? `http://${window.location.hostname}:${SERVER_PORT}` : `http://localhost:${SERVER_PORT}`)
  : 'https://codesphere-x5bs.onrender.com');

export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || (isDevelopment
  ? (typeof window !== 'undefined' ? `ws://${window.location.hostname}:${SERVER_PORT}` : `ws://localhost:${SERVER_PORT}`)
  : 'wss://codesphere-x5bs.onrender.com');
