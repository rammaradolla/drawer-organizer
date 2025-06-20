const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');

// Test email route (remove in production)
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email || 'test@example.com';
    const result = await emailService.sendTestEmail(testEmail);
    
    res.json({
      success: result,
      message: result ? 'Test email sent successfully!' : 'Failed to send test email',
      testEmail
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

module.exports = router; 