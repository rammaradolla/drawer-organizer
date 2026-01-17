import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode (development/production)
  // Vite automatically loads .env, .env.local, .env.[mode], .env.[mode].local
  const env = loadEnv(mode, process.cwd(), '');

  // Consistent port configuration
  const CLIENT_PORT = 5173;
  const SERVER_PORT = 3000;

  // Get API target from environment variables
  // Priority: VITE_API_TARGET (from .env files) > default localhost
  // Ensure apiTarget is always a valid string URL (never null/undefined)
  let apiTarget = env.VITE_API_TARGET;
  if (!apiTarget || typeof apiTarget !== 'string' || apiTarget.trim() === '' || apiTarget === 'null' || apiTarget === 'undefined') {
    console.warn(`Invalid or missing VITE_API_TARGET: "${apiTarget}", using default: http://localhost:3000`);
    apiTarget = 'http://localhost:3000';
  }
  // Remove trailing slashes and ensure it's a valid URL
  apiTarget = String(apiTarget).replace(/\/+$/, '');
  
  // Final validation - ensure apiTarget is a valid URL string
  try {
    new URL(apiTarget);
  } catch (e) {
    console.error(`Invalid URL format for apiTarget: "${apiTarget}", using default: http://localhost:3000`);
    apiTarget = 'http://localhost:3000';
  }

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: CLIENT_PORT,
      strictPort: true, // Exit if port is already in use instead of trying the next available port
      hmr: {
        port: CLIENT_PORT,
      },
      // Configure CORS - allow all origins for development
      // Using simple true value to avoid null split errors
      cors: true,
      // Proxy API requests to backend server
      // Use environment variable for server URL, or default to localhost
      // When accessed from other machines, set VITE_API_TARGET to your server IP
      proxy: {
        '/api': {
          target: String(apiTarget), // Ensure it's a string
          changeOrigin: true, // Recommended for virtual hosts
          secure: false, // Recommended for local development
        },
      },
    },
    define: {
      // Make port constants available in the app
      __CLIENT_PORT__: CLIENT_PORT,
      __SERVER_PORT__: SERVER_PORT,
      __API_URL__: `"${apiTarget}/api"`,
      // Expose environment variables to the app (only VITE_ prefixed)
      // These are available via import.meta.env
    },
  };
})
