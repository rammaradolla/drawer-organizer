# Port Configuration Documentation

## Overview
This application uses a **consistent, single-port configuration** to ensure reliable development and deployment.

## Port Assignments

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| **Client (Vite)** | `5173` | `http://localhost:5173` | React frontend development server |
| **Server (Express)** | `3000` | `http://localhost:3000` | Backend API server |

## Configuration Files

### 1. Client Configuration
- **File**: `client/vite.config.js`
- **Key Settings**:
  ```js
  const CLIENT_PORT = 5173;
  server: {
    port: CLIENT_PORT,
    strictPort: true, // Prevents auto-increment
  }
  ```

### 2. Server Configuration
- **File**: `server/app.js` + `server/config/ports.js`
- **Key Settings**:
  ```js
  const PORTS = { CLIENT: 5173, SERVER: 3000 };
  const PORT = process.env.PORT || 3000;
  ```

### 3. Centralized Configuration
- **Client**: `client/src/config/ports.js`
- **Server**: `server/config/ports.js`
- **Purpose**: Single source of truth for port constants

## Scripts Available

### Root Level (`npm run <script>`)
- `check-ports` - Check if ports 5173 and 3000 are available
- `kill-ports` - Kill any processes using ports 5173 and 3000
- `setup-ports` - Clean and check ports before starting
- `dev` - Start both client and server concurrently

### Client (`cd client && npm run <script>`)
- `dev` - Start development server on port 5173
- `dev:port` - Explicitly start on port 5173
- `check-port` - Check if port 5173 is available
- `kill-port` - Kill process on port 5173

### Server (`cd server && npm run <script>`)
- `dev` - Start development server on port 3000
- `dev:port` - Explicitly start on port 3000
- `check-port` - Check if port 3000 is available
- `kill-port` - Kill process on port 3000
- `check-all-ports` - Check both client and server ports

## Key Features

### ✅ Strict Port Enforcement
- **Client**: `strictPort: true` in Vite config prevents auto-increment
- **Server**: Explicit port configuration with environment variable fallback

### ✅ CORS Configuration
- Server only accepts requests from `http://localhost:5173`
- No multiple port allowances for security

### ✅ Proxy Configuration
- Client automatically proxies `/api` requests to `http://localhost:3000`
- Seamless API communication without hardcoded URLs

### ✅ Port Management Scripts
- Easy port checking and cleanup
- Prevents "port already in use" issues

## Troubleshooting

### Problem: "Port 5173 already in use"
```bash
npm run kill-ports  # Kill all processes
npm run setup-ports # Clean and verify
npm run dev         # Start application
```

### Problem: CORS errors
- Ensure client is running on port 5173
- Check server CORS configuration in `server/app.js`

### Problem: API requests fail
- Verify server is running on port 3000
- Check proxy configuration in `client/vite.config.js`

## Environment Variables

### Server (optional)
```bash
PORT=3000           # Server port (defaults to 3000)
CORS_ORIGIN=...     # Additional CORS origin if needed
```

### Client
No environment variables needed - configuration is in `vite.config.js`

## Consistency Benefits

1. **No Port Confusion**: Always use the same URLs
2. **Reliable Development**: No "which port is it running on?" questions
3. **Easy Debugging**: Consistent endpoints for API calls
4. **Team Collaboration**: Everyone uses the same configuration
5. **Deployment Ready**: Clear port separation for production

## Quick Start

```bash
# Clean any existing processes and start everything
npm run setup-ports
npm run dev

# Client: http://localhost:5173
# Server: http://localhost:3000
# API:    http://localhost:3000/api
``` 