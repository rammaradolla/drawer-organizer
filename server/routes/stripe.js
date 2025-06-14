const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { createCheckoutSession, handleWebhook } = require('../services/stripeService');

// Create checkout session
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { userId, cartItems } = req.body;

    if (!userId || !cartItems || !Array.isArray(cartItems)) {
      return res.status(400).json({ error: 'Invalid request data' });
    }

    const result = await createCheckoutSession(userId, cartItems);
    res.json(result);
  } catch (error) {
    console.error('Error in create-checkout-session:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
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
});

module.exports = router; 