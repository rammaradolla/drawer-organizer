// Centralized port configuration for server
const PORTS = {
  CLIENT: 5173,
  SERVER: 3000,
};

// Server configuration
const SERVER_CONFIG = {
  PORT: process.env.PORT || PORTS.SERVER,
  CLIENT_URL: process.env.CLIENT_URL || `http://localhost:${PORTS.CLIENT}`,
  CORS_ORIGINS: [
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