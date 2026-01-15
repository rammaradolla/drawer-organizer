// Email Debugging Script
// Run with: node server/test-email-debug.js

require('dotenv').config({ path: './server/.env' });
const nodemailer = require('nodemailer');

console.log('='.repeat(60));
console.log('EMAIL CONFIGURATION DEBUG');
console.log('='.repeat(60));
console.log('');

// Check environment variables
console.log('1. Environment Variables:');
console.log('-'.repeat(60));
console.log('EMAIL_HOST:', process.env.EMAIL_HOST || 'NOT SET');
console.log('EMAIL_PORT:', process.env.EMAIL_PORT || 'NOT SET');
console.log('EMAIL_SECURE:', process.env.EMAIL_SECURE || 'NOT SET');
console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
console.log('EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'NOT SET');
console.log('');

// Determine configuration type
let transporterConfig;
if (process.env.EMAIL_HOST) {
  console.log('2. Configuration Type: SMTP (EMAIL_HOST detected)');
  console.log('-'.repeat(60));
  transporterConfig = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '465'),
    secure: process.env.EMAIL_SECURE === 'true' || process.env.EMAIL_PORT === '465',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
  console.log('SMTP Host:', transporterConfig.host);
  console.log('SMTP Port:', transporterConfig.port);
  console.log('Secure (SSL/TLS):', transporterConfig.secure);
  console.log('Auth User:', transporterConfig.auth.user);
  console.log('Auth Pass:', transporterConfig.auth.pass ? '***SET***' : 'NOT SET');
} else {
  console.log('2. Configuration Type: Service-based (EMAIL_SERVICE)');
  console.log('-'.repeat(60));
  transporterConfig = {
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  };
  console.log('Service:', transporterConfig.service);
  console.log('Auth User:', transporterConfig.auth.user);
  console.log('Auth Pass:', transporterConfig.auth.pass ? '***SET***' : 'NOT SET');
}
console.log('');

// Create transporter
console.log('3. Creating Email Transporter...');
console.log('-'.repeat(60));
const transporter = nodemailer.createTransport(transporterConfig);

// Verify connection
console.log('4. Verifying SMTP Connection...');
console.log('-'.repeat(60));
transporter.verify((error, success) => {
  if (error) {
    console.log('❌ CONNECTION FAILED');
    console.log('Error:', error.message);
    console.log('Error Code:', error.code);
    if (error.code === 'EAUTH') {
      console.log('');
      console.log('🔴 AUTHENTICATION ERROR DETECTED');
      console.log('This means your email credentials are incorrect.');
      console.log('');
      console.log('Fix Steps:');
      console.log('1. Verify email account exists in GoDaddy');
      console.log('2. Test password by logging into GoDaddy webmail');
      console.log('3. Reset password in GoDaddy if needed');
      console.log('4. Update EMAIL_PASS in server/.env with correct password');
      console.log('5. Make sure EMAIL_USER is full email: support@design2organize.net');
      console.log('6. Restart server after changing .env');
    }
    console.log('');
    console.log('Common Issues:');
    console.log('1. Wrong password - Most common! Verify in GoDaddy');
    console.log('2. Wrong SMTP host - Should be smtpout.secureserver.net for GoDaddy');
    console.log('3. Wrong port - Try 587 instead of 465');
    console.log('4. Email account not activated - Verify in GoDaddy dashboard');
    console.log('5. SMTP disabled - Check GoDaddy email settings');
    console.log('');
    console.log('For GoDaddy, try:');
    console.log('  EMAIL_HOST=smtpout.secureserver.net');
    console.log('  EMAIL_PORT=587');
    console.log('  EMAIL_SECURE=false');
    process.exit(1);
  } else {
    console.log('✅ CONNECTION SUCCESSFUL');
    console.log('SMTP server is ready to send emails');
    console.log('');
    
    // Try sending a test email
    console.log('5. Sending Test Email...');
    console.log('-'.repeat(60));
    const testEmail = process.argv[2] || process.env.EMAIL_USER || 'test@example.com';
    
    const mailOptions = {
      from: `"Design2Organize Support" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: 'Test Email from Design2Organize',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #14b8a6;">Test Email</h1>
          <p>This is a test email from your Design2Organize application.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <p><strong>From:</strong> ${process.env.EMAIL_USER}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('❌ EMAIL SEND FAILED');
        console.log('Error:', error.message);
        console.log('Error Code:', error.code);
        console.log('Error Response:', error.response);
        console.log('');
        console.log('Troubleshooting:');
        console.log('1. Check email password is correct');
        console.log('2. Verify email account is active in GoDaddy');
        console.log('3. Check if SMTP authentication is enabled');
        console.log('4. Try different port (587 instead of 465)');
        process.exit(1);
      } else {
        console.log('✅ EMAIL SENT SUCCESSFULLY');
        console.log('Message ID:', info.messageId);
        console.log('Response:', info.response);
        console.log('');
        console.log('Test email sent to:', testEmail);
        console.log('Check your inbox (and spam folder) for the test email.');
        console.log('');
        console.log('If you received the email, your configuration is correct!');
        process.exit(0);
      }
    });
  }
});
