#!/usr/bin/env node

/**
 * Email Configuration Test Script
 * This script validates email configuration without actually sending emails
 */

require('dotenv').config();
const nodemailer = require('nodemailer');
const path = require('path');

console.log('='.repeat(60));
console.log('EMAIL CONFIGURATION TEST');
console.log('='.repeat(60));
console.log('');

// Check environment variables
console.log('1. Checking Environment Variables...');
console.log('-'.repeat(60));

const envVars = {
  EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail (default)',
  EMAIL_USER: process.env.EMAIL_USER || 'NOT SET',
  EMAIL_PASS: process.env.EMAIL_PASS ? '***SET***' : 'NOT SET',
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ? 'SET' : 'NOT SET',
  SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET'
};

let allConfigured = true;

for (const [key, value] of Object.entries(envVars)) {
  const status = value === 'NOT SET' ? '❌' : '✅';
  if (value === 'NOT SET') allConfigured = false;
  console.log(`${status} ${key}: ${value}`);
}

console.log('');
console.log(`Overall Status: ${allConfigured ? '✅ All Required Variables Set' : '❌ Missing Variables'}`);
console.log('');

// Check email service configuration
console.log('2. Testing Email Service Configuration...');
console.log('-'.repeat(60));

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.log('❌ EMAIL_USER or EMAIL_PASS not set. Cannot test email service.');
  console.log('');
  console.log('To fix this:');
  console.log('1. Create/update server/.env file with:');
  console.log('   EMAIL_SERVICE=gmail');
  console.log('   EMAIL_USER=your-email@gmail.com');
  console.log('   EMAIL_PASS=your-app-password');
  console.log('');
  console.log('2. For Gmail, get an App Password:');
  console.log('   - Enable 2-Step Verification: https://myaccount.google.com/security');
  console.log('   - Generate App Password: https://myaccount.google.com/apppasswords');
  console.log('   - Use the 16-character password in EMAIL_PASS');
  process.exit(1);
}

// Try to create transporter
try {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  console.log('✅ Email transporter created successfully');
  console.log(`   Service: ${process.env.EMAIL_SERVICE || 'gmail'}`);
  console.log(`   From Email: ${process.env.EMAIL_USER}`);
  console.log('');

  // Test connection (verify credentials)
  console.log('3. Verifying Email Credentials...');
  console.log('-'.repeat(60));
  
  transporter.verify((error, success) => {
    if (error) {
      console.log('❌ Email credentials verification FAILED');
      console.log(`   Error: ${error.message}`);
      console.log('');
      console.log('Common issues:');
      console.log('- Using regular password instead of App Password');
      console.log('- 2-Step Verification not enabled');
      console.log('- Incorrect email address');
      console.log('- App Password expired or revoked');
      console.log('');
      console.log('Solutions:');
      console.log('1. Verify EMAIL_USER is correct');
      console.log('2. Make sure EMAIL_PASS is an App Password (16 characters)');
      console.log('3. Regenerate App Password if needed');
      console.log('4. Check if 2-Step Verification is enabled');
      process.exit(1);
    } else {
      console.log('✅ Email credentials verified successfully!');
      console.log('   Email service is ready to send emails');
      console.log('');
      console.log('='.repeat(60));
      console.log('✅ ALL TESTS PASSED');
      console.log('='.repeat(60));
      console.log('');
      console.log('Next steps:');
      console.log('1. Start your server: cd server && npm start');
      console.log('2. Test email endpoint:');
      console.log('   curl -X POST http://localhost:3000/api/stripe/test-email \\');
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     -d \'{"toEmail": "your-test-email@gmail.com"}\'');
      console.log('');
      console.log('3. Check webhook status:');
      console.log('   curl http://localhost:3000/api/stripe/webhook-status');
      console.log('');
      process.exit(0);
    }
  });

} catch (error) {
  console.log('❌ Failed to create email transporter');
  console.log(`   Error: ${error.message}`);
  process.exit(1);
}
