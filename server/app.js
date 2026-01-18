const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables right away (for backward compatibility)
dotenv.config();

// Load centralized environment configuration
// This reads ENV_MODE from root .env and loads appropriate config
const { config: envConfig, getEnvMode } = require('../config/env');

const path = require('path');
const { PORTS, SERVER_CONFIG } = require('./config/ports');
const { router: stripeRouter, webhookHandler: stripeWebhookHandler } = require('./routes/stripe');

const app = express();

// Middleware - Using centralized configuration
// Allow all origins if ALLOW_ALL_ORIGINS is set (for testing from other machines)
// Priority: envConfig (from centralized config) > process.env (from .env file) > SERVER_CONFIG (fallback)
const allowAllOrigins = envConfig.ALLOW_ALL_ORIGINS || process.env.ALLOW_ALL_ORIGINS === 'true';
const corsOrigins = envConfig.CORS_ORIGINS || SERVER_CONFIG.CORS_ORIGINS;

const corsOptions = allowAllOrigins
  ? {
      origin: true, // Allow all origins
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  : {
      origin: corsOrigins,
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    };
app.use(cors(corsOptions));

// Stripe webhook must be registered before express.json() to receive raw body
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhookHandler);

// Regular middleware for other routes
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/design', require('./routes/design'));
app.use('/api/order', require('./routes/order'));
app.use('/api/stripe', stripeRouter); // Use the router for other stripe routes
app.use('/api/fulfillment', require('./routes/fulfillment'));
app.use('/api/profile', require('./routes/profile'));
const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);

// Only enable test routes in development
// Use centralized config to determine environment
const isDevelopment = envConfig.NODE_ENV !== 'production' || getEnvMode() === 'development';
if (isDevelopment) {
  app.use('/api/test', require('./routes/test'));
}

// Serve static files from public directory (for images, logos, etc.)
// This works for both development and production
const publicPath = path.join(__dirname, '../client/public');
app.use('/images', express.static(publicPath + '/images'));

// Serve static files from React app in production
// Use centralized config to determine environment
const isProduction = envConfig.NODE_ENV === 'production' || getEnvMode() === 'production';
if (isProduction) {
  const clientBuildPath = path.join(__dirname, '../client/dist');
  // Serve static files (JS, CSS, images, etc.)
  app.use(express.static(clientBuildPath));
  
  // Handle React routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  });
} else {
  // In development, also serve public directory
  app.use(express.static(publicPath));
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    error: isDevelopment ? err.message : undefined
  });
});

// Use centralized configuration (priority: envConfig > process.env > SERVER_CONFIG)
const PORT = envConfig.PORT || SERVER_CONFIG.PORT;
// Listen on all network interfaces (0.0.0.0) to allow access from other machines
const HOST = envConfig.HOST || process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  const clientUrl = envConfig.CLIENT_URL || SERVER_CONFIG.CLIENT_URL;
  const corsOriginsDisplay = allowAllOrigins ? ['* (all origins)'] : corsOrigins;
  
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📱 Environment: ${getEnvMode()} (${envConfig.NODE_ENV})`);
  console.log(`📱 Client running on port ${PORTS.CLIENT}`);
  console.log(`🔗 Accepting client requests from: ${clientUrl}`);
  console.log(`🌐 CORS origins:`, corsOriginsDisplay);
  if (HOST === '0.0.0.0') {
    console.log(`🌍 Server is accessible from other machines on your network`);
    console.log(`   Use your local IP address (e.g., http://192.168.x.x:${PORT}) to access from other devices`);
  }
}); 