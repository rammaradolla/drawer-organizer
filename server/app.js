const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const { PORTS, SERVER_CONFIG } = require('./config/ports');

// Load environment variables
dotenv.config();

const app = express();

// Middleware - Using centralized port configuration
app.use(cors({
  origin: SERVER_CONFIG.CORS_ORIGINS,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/design', require('./routes/design'));
app.use('/api/order', require('./routes/order'));

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