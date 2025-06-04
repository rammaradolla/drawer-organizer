// Centralized port configuration for server
const PORTS = {
  CLIENT: 5173,
  SERVER: 3000,
};

// Server configuration
const SERVER_CONFIG = {
  PORT: process.env.PORT || PORTS.SERVER,
  CLIENT_URL: `http://localhost:${PORTS.CLIENT}`,
  CORS_ORIGINS: [
    `http://localhost:${PORTS.CLIENT}`,
    process.env.CORS_ORIGIN
  ].filter(Boolean),
};

module.exports = {
  PORTS,
  SERVER_CONFIG,
}; 