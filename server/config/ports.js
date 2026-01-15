// Centralized port configuration for server
const PORTS = {
  CLIENT: 5173,
  SERVER: 3000,
};

// Server configuration
const CLIENT_URL = process.env.CLIENT_URL || 
  (process.env.NODE_ENV === 'production' 
    ? process.env.DOMAIN_URL || 'https://design2organize.net'
    : `http://localhost:${PORTS.CLIENT}`);

const SERVER_CONFIG = {
  PORT: process.env.PORT || PORTS.SERVER,
  CLIENT_URL: CLIENT_URL,
  CORS_ORIGINS: process.env.NODE_ENV === 'production'
    ? [
        CLIENT_URL,
        process.env.CORS_ORIGIN,
        process.env.DOMAIN_URL
      ].filter(Boolean)
    : [
        `http://localhost:${PORTS.CLIENT}`,
        process.env.CORS_ORIGIN,
        // Allow requests from any origin when in development mode (for testing from other machines)
        ...(process.env.ALLOW_ALL_ORIGINS === 'true' ? ['*'] : [])
      ].filter(Boolean),
};

module.exports = {
  PORTS,
  SERVER_CONFIG,
}; 