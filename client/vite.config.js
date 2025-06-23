import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Consistent port configuration
const CLIENT_PORT = 5173;
const SERVER_PORT = 3000;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: CLIENT_PORT,
    strictPort: true, // Exit if port is already in use instead of trying the next available port
    hmr: {
      port: CLIENT_PORT,
    },
    // Proxy API requests to backend server
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true, // Recommended for virtual hosts
        secure: false, // Recommended for local development
      },
    },
  },
  define: {
    // Make port constants available in the app
    __CLIENT_PORT__: CLIENT_PORT,
    __SERVER_PORT__: SERVER_PORT,
    __API_URL__: `"http://localhost:${SERVER_PORT}/api"`,
  },
})
