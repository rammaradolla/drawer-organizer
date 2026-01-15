# Webhook & Email Service Not Calling - Debug Guide

## Problem: Email Service Not Being Called

The email service is only triggered by Stripe webhooks. If you're running locally, webhooks won't reach your server unless you forward them.

## Quick Check: Is Webhook Being Received?

Check your server console logs. You should see:

**✅ Webhook Received:**
```
[Stripe Webhook] Received event: checkout.session.completed
[Stripe Webhook] Processing checkout.session.completed for session: cs_test_xxx
[Stripe Webhook] Found order abc123. Current status: pending
[Stripe Webhook] Attempting to send order confirmation email for order abc123...
[Order Confirmation Email] FUNCTION CALLED for order abc123
```

**❌ No Webhook (Most Common Issue Locally):**
```
(No webhook messages in console)
```

## Solution 1: Forward Stripe Webhooks Locally (Required for Local Testing)

### Step 1: Install Stripe CLI
```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### Step 2: Login to Stripe
```bash
stripe login
```

### Step 3: Forward Webhooks
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

**Important:** Keep this terminal window open while testing!

### Step 4: Copy Webhook Secret
When you run `stripe listen`, you'll see:
```
> Ready! Your webhook signing secret is whsec_xxxxx
```

Copy this secret and add to `server/.env`:
```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Step 5: Restart Your Server
```bash
# Restart your Node.js server
npm run server:dev
```

### Step 6: Complete a Test Order
Now when you complete a payment, the webhook will be forwarded and email should send.

## Solution 2: Manually Trigger Email (For Testing)

If you have an existing order ID, you can manually trigger the email:

### Option A: Use API Endpoint
```bash
curl -X POST http://localhost:3000/api/stripe/test-order-email/ORDER_ID
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/stripe/test-order-email/abc123def456
```

### Option B: Use Browser/Postman
- **URL:** `POST http://localhost:3000/api/stripe/test-order-email/ORDER_ID`
- Replace `ORDER_ID` with actual order ID from your database

## Solution 3: Check Server Logs

Look for these log messages to trace the flow:

### 1. Webhook Received?
```
[Stripe Webhook] Received event: checkout.session.completed
```
→ If you DON'T see this, webhook isn't reaching your server

### 2. Order Found?
```
[Stripe Webhook] Found order abc123. Current status: pending
```
→ If you DON'T see this, order might not exist in database

### 3. Email Function Called?
```
[Order Confirmation Email] FUNCTION CALLED for order abc123
```
→ If you DON'T see this, email function isn't being invoked

### 4. Email Sent?
```
[Order Confirmation Email] Successfully sent confirmation email
```
→ If you DON'T see this, check email configuration

## Common Issues

### Issue 1: No Webhook Messages in Console
**Problem:** Webhook not reaching local server

**Solution:**
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Keep the CLI running while testing
- Set `STRIPE_WEBHOOK_SECRET` in `.env`

### Issue 2: "Order not found" Error
**Problem:** Order doesn't exist in database or `stripe_checkout_id` doesn't match

**Solution:**
- Check order exists in Supabase
- Verify `stripe_checkout_id` matches session ID
- Check server logs for order lookup errors

### Issue 3: Webhook Received But Email Not Called
**Problem:** Code flow stops before email function

**Solution:**
- Check server logs for errors before email call
- Verify order status update succeeds
- Check for exceptions in webhook handler

### Issue 4: Email Function Called But Email Not Sent
**Problem:** Email configuration issue

**Solution:**
- Run: `node server/test-email-debug.js your-email@gmail.com`
- Check email credentials in `.env`
- Verify GoDaddy email account is active

## Debugging Checklist

- [ ] Stripe CLI is running: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` is set in `server/.env`
- [ ] Server restarted after setting webhook secret
- [ ] Server console shows: `[Stripe Webhook] Received event: checkout.session.completed`
- [ ] Server console shows: `[Order Confirmation Email] FUNCTION CALLED`
- [ ] Email configuration is correct in `.env`
- [ ] Test email works: `POST /api/stripe/test-email`

## Quick Test Flow

1. **Start Stripe CLI:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **Copy webhook secret** and add to `.env`

3. **Restart server**

4. **Complete a test order**

5. **Watch server console** for:
   - Webhook received
   - Order found
   - Email function called
   - Email sent

## Production Note

In production, webhooks work automatically - no Stripe CLI needed. This is only for local development.

---

**Most Common Issue:** Webhook not reaching local server. Use Stripe CLI to forward webhooks!
