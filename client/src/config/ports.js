// Centralized port configuration for consistent usage across the application
export const PORTS = {
  CLIENT: 5173,
  SERVER: 3000,
};

// API configuration
export const API_CONFIG = {
  BASE_URL: `http://localhost:${PORTS.SERVER}/api`,
  CLIENT_URL: `http://localhost:${PORTS.CLIENT}`,
};

// Development server configuration
export const DEV_CONFIG = {
  CLIENT_PORT: PORTS.CLIENT,
  SERVER_PORT: PORTS.SERVER,
  STRICT_PORT: true, // Don't auto-increment ports
};

export default PORTS; 