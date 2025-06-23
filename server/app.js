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
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGINS,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  credentials: true
}));

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
app.use('/api/admin', require('./routes/admin'));
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
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Client running on port ${PORTS.CLIENT}`);
  console.log(`🔗 Accepting client requests from: ${SERVER_CONFIG.CLIENT_URL}`);
  console.log(`🌐 CORS origins:`, SERVER_CONFIG.CORS_ORIGINS);
}); 