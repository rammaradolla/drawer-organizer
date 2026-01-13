const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables right away
dotenv.config();

const path = require('path');
const { PORTS, SERVER_CONFIG } = require('./config/ports');
const { router: stripeRouter, webhookHandler: stripeWebhookHandler } = require('./routes/stripe');

const app = express();

// Middleware - Using centralized port configuration
// Allow all origins if ALLOW_ALL_ORIGINS is set (for testing from other machines)
const corsOptions = process.env.ALLOW_ALL_ORIGINS === 'true' 
  ? {
      origin: true, // Allow all origins
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true
    }
  : {
      origin: SERVER_CONFIG.CORS_ORIGINS,
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
app.use('/api/test', require('./routes/test')); // Test route (remove in production)

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Use centralized port configuration
const PORT = SERVER_CONFIG.PORT;
// Listen on all network interfaces (0.0.0.0) to allow access from other machines
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  console.log(`📱 Client running on port ${PORTS.CLIENT}`);
  console.log(`🔗 Accepting client requests from: ${SERVER_CONFIG.CLIENT_URL}`);
  console.log(`🌐 CORS origins:`, SERVER_CONFIG.CORS_ORIGINS);
  if (HOST === '0.0.0.0') {
    console.log(`🌍 Server is accessible from other machines on your network`);
    console.log(`   Use your local IP address (e.g., http://192.168.x.x:${PORT}) to access from other devices`);
  }
}); 