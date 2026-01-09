const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCheckoutSession, handleWebhook } = require('../services/stripeService');

// This handler will be registered separately in app.js with a raw body parser.
const webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await handleWebhook(event);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, cartItems, addresses } = req.body;

    if (!userId || !cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Validate addresses if provided
    if (addresses) {
      const { validateBillingAddress, validateShippingAddress } = require('../utils/addressValidation');
      
      const billingValidation = validateBillingAddress(addresses);
      if (!billingValidation.valid) {
        return res.status(400).json({
          error: 'Billing address validation failed',
          errors: billingValidation.errors
        });
      }

      // Check if shipping is same as billing
      const sameAsBilling = addresses.same_as_billing === true;
      if (!sameAsBilling) {
        const shippingValidation = validateShippingAddress(addresses, false);
        if (!shippingValidation.valid) {
          return res.status(400).json({
            error: 'Shipping address validation failed',
            errors: shippingValidation.errors
          });
        }
      } else {
        // Copy billing to shipping if same as billing
        addresses.shipping_street = addresses.billing_street;
        addresses.shipping_city = addresses.billing_city;
        addresses.shipping_state = addresses.billing_state;
        addresses.shipping_zip = addresses.billing_zip;
        addresses.shipping_country = addresses.billing_country || 'US';
        addresses.shipping_phone = addresses.billing_phone;
      }
    }

    const result = await createCheckoutSession(userId, cartItems, addresses);
    res.json(result);
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    console.error('Error stack:', error.stack);
    console.error('Request body:', JSON.stringify(req.body, null, 2));
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Diagnostic endpoint to check order status and manually trigger email (for testing)
router.post('/test-order-email/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const emailService = require('../services/emailService');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey (
          id,
          email,
          name
        )
      `)
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found',
        details: orderError
      });
    }

    // Try to send email
    const emailSent = await emailService.sendOrderConfirmation(orderId);

    res.json({
      success: true,
      order: {
        id: order.id,
        status: order.status,
        stripe_checkout_id: order.stripe_checkout_id,
        user_email: order.users?.email,
        user_name: order.users?.name
      },
      email_sent: emailSent,
      message: emailSent 
        ? `Email sent successfully to ${order.users?.email}`
        : `Failed to send email. Check server logs for details.`
    });
  } catch (error) {
    console.error('Error in test-order-email:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Diagnostic endpoint to check webhook configuration
router.get('/webhook-status', async (req, res) => {
  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const webhookUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/api/stripe/webhook`;

    res.json({
      webhook_configured: !!webhookSecret,
      webhook_secret_set: !!webhookSecret,
      webhook_url: webhookUrl,
      email_service_configured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS),
      email_user: process.env.EMAIL_USER ? `${process.env.EMAIL_USER.substring(0, 3)}***` : 'NOT SET',
      email_service: process.env.EMAIL_SERVICE || 'gmail (default)',
      stripe_secret_key: process.env.STRIPE_SECRET_KEY ? 'SET' : 'NOT SET',
      instructions: [
        '1. Check Stripe Dashboard > Developers > Webhooks',
        '2. Ensure webhook endpoint is configured: ' + webhookUrl,
        '3. Ensure event "checkout.session.completed" is enabled',
        '4. Verify STRIPE_WEBHOOK_SECRET matches the webhook signing secret in Stripe',
        '5. Check server logs for webhook events: [Stripe Webhook] Received event:',
        '6. For local testing, use: stripe listen --forward-to localhost:3000/api/stripe/webhook'
      ]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test email sending directly (without needing an order)
router.post('/test-email', async (req, res) => {
  try {
    const { toEmail } = req.body;
    const emailService = require('../services/emailService');

    if (!toEmail) {
      return res.status(400).json({
        success: false,
        error: 'toEmail is required in request body'
      });
    }

    // Check email configuration
    const emailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
    
    if (!emailConfigured) {
      return res.status(500).json({
        success: false,
        error: 'Email service not configured',
        details: {
          EMAIL_USER: !!process.env.EMAIL_USER,
          EMAIL_PASS: !!process.env.EMAIL_PASS,
          EMAIL_SERVICE: process.env.EMAIL_SERVICE || 'gmail (default)'
        },
        instructions: [
          '1. Set EMAIL_USER in your .env file (e.g., your-email@gmail.com)',
          '2. Set EMAIL_PASS in your .env file (Gmail App Password, not regular password)',
          '3. For Gmail, enable 2-Step Verification and create App Password at:',
          '   https://myaccount.google.com/apppasswords'
        ]
      });
    }

    // Try to send test email
    const emailSent = await emailService.sendTestEmail(toEmail);

    res.json({
      success: emailSent,
      message: emailSent 
        ? `Test email sent successfully to ${toEmail}`
        : `Failed to send test email. Check server logs for details.`,
      from_email: process.env.EMAIL_USER,
      to_email: toEmail,
      email_service: process.env.EMAIL_SERVICE || 'gmail'
    });
  } catch (error) {
    console.error('Error in test-email:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = { router, webhookHandler }; 