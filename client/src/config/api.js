// Centralized API and WebSocket configuration
const isDevelopment = process.env.NODE_ENV === 'development';

export const SERVER_PORT = 5100;

// In production, REACT_APP_API_BASE_URL MUST be set in Vercel environment variables.
// Without it, API calls will hit the Vercel frontend (causing 405 errors).
if (process.env.NODE_ENV === 'production' && !process.env.REACT_APP_API_BASE_URL) {
  console.error(
    '[CodeSphere] REACT_APP_API_BASE_URL is not set! ' +
    'API calls will fail. Set it in Vercel → Settings → Environment Variables.'
  );
}

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || (isDevelopment 
  ? `http://${window.location.hostname}:${SERVER_PORT}`
  : '');  // Empty string in prod without env var — will cause visible fetch errors, not silent 405s

export const WS_BASE_URL = process.env.REACT_APP_WS_BASE_URL || (isDevelopment
  ? `ws://${window.location.hostname}:${SERVER_PORT}`
  : '');
