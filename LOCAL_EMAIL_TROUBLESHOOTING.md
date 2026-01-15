# Local Email Troubleshooting Guide

## Issue: Not Receiving Order Confirmation Emails Locally

When running locally, order confirmation emails are triggered by Stripe webhooks. Here's how to diagnose and fix:

## Step 1: Check Email Configuration

First, verify your email settings in `server/.env`:

```env
# GoDaddy Email Configuration
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password
```

**Verify:**
- ✅ `EMAIL_USER` is set to `support@design2organize.net`
- ✅ `EMAIL_PASS` is the correct password
- ✅ `EMAIL_HOST` is `smtpout.secureserver.net` (for GoDaddy)

## Step 2: Test Email Directly (Without Order)

Test if email sending works at all:

```bash
# Using curl
curl -X POST http://localhost:3000/api/stripe/test-email \
  -H "Content-Type: application/json" \
  -d '{"toEmail": "your-test-email@gmail.com"}'
```

Or use Postman/Thunder Client:
- **URL:** `POST http://localhost:3000/api/stripe/test-email`
- **Body:**
  ```json
  {
    "toEmail": "your-test-email@gmail.com"
  }
  ```

**Expected Response:**
```json
{
  "success": true,
  "message": "Test email sent successfully to your-test-email@gmail.com",
  "from_email": "support@design2organize.net"
}
```

**If this fails:**
- Check server console logs for errors
- Verify email credentials are correct
- Check GoDaddy email account is active

## Step 3: Check if Stripe Webhook is Being Received

Order confirmation emails are triggered by Stripe webhooks. Locally, you need to forward webhooks to your local server.

### Option A: Use Stripe CLI (Recommended)

1. **Install Stripe CLI:**
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Or download from: https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. **Copy the webhook signing secret** (starts with `whsec_`)

5. **Add to your `.env` file:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_xxxxx
   ```

6. **Restart your server**

7. **Complete a test order** - webhook will be forwarded and email should send

### Option B: Check Webhook Status Endpoint

Check if webhook is configured:

```bash
curl http://localhost:3000/api/stripe/webhook-status
```

**Expected Response:**
```json
{
  "webhook_configured": true,
  "webhook_secret_set": true,
  "email_service_configured": true,
  "email_user": "sup***"
}
```

## Step 4: Manually Trigger Email for Existing Order

If you have an order ID, you can manually trigger the email:

```bash
# Replace ORDER_ID with actual order ID
curl -X POST http://localhost:3000/api/stripe/test-order-email/ORDER_ID
```

**Example:**
```bash
curl -X POST http://localhost:3000/api/stripe/test-order-email/abc123def456
```

## Step 5: Check Server Logs

Look for these log messages in your server console:

### Successful Email:
```
[Order Confirmation Email] Starting email send for order abc123
[Order Confirmation Email] Found user customer@example.com for order abc123
[Order Confirmation Email] Attempting to send email from "Design2Organize Support" <support@design2organize.net> to customer@example.com
[Order Confirmation Email] Successfully sent confirmation email to customer@example.com for order abc123
```

### Webhook Received:
```
[Stripe Webhook] Received event: checkout.session.completed
[Stripe Webhook] Processing checkout.session.completed for session: cs_test_xxx
[Stripe Webhook] Order confirmation email sent for order abc123
```

### Common Errors:

**Email not configured:**
```
[Order Confirmation Email] Email service not configured. EMAIL_USER: false, EMAIL_PASS: false
```
→ Fix: Set `EMAIL_USER` and `EMAIL_PASS` in `.env`

**SMTP connection error:**
```
Error: Invalid login: 535 Authentication failed
```
→ Fix: Check email password is correct

**Webhook not received:**
```
[Stripe Webhook] Received event: checkout.session.completed
```
→ If you don't see this, webhook isn't reaching your server
→ Use Stripe CLI to forward webhooks locally

## Step 6: Verify GoDaddy Email Settings

1. **Check email account exists:**
   - Log in to GoDaddy
   - Go to Email & Office Dashboard
   - Verify `support@design2organize.net` exists

2. **Test email account:**
   - Try logging into webmail
   - Verify password is correct

3. **Check SMTP settings:**
   - Host: `smtpout.secureserver.net`
   - Port: `465` (SSL) or `587` (TLS)
   - Authentication: Required

## Common Issues & Solutions

### Issue 1: "Email service not configured"
**Solution:**
- Check `server/.env` file exists
- Verify `EMAIL_USER` and `EMAIL_PASS` are set
- Restart server after changing `.env`

### Issue 2: "Authentication failed"
**Solution:**
- Verify email password is correct
- Try port 587 with `EMAIL_SECURE=false`
- Check GoDaddy email account is active

### Issue 3: "Webhook not received"
**Solution:**
- Use Stripe CLI: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- Set `STRIPE_WEBHOOK_SECRET` in `.env`
- Check server logs for webhook events

### Issue 4: "Email sent but not received"
**Solution:**
- Check spam/junk folder
- Verify recipient email is correct
- Check GoDaddy email account for bounces
- Add SPF record to DNS (see GODADDY_EMAIL_CONFIG.md)

## Quick Test Checklist

- [ ] Email configuration in `.env` is correct
- [ ] Test email endpoint works: `POST /api/stripe/test-email`
- [ ] Stripe CLI is forwarding webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] `STRIPE_WEBHOOK_SECRET` is set in `.env`
- [ ] Server logs show webhook events
- [ ] Server logs show email sending attempts
- [ ] Check spam folder for emails

## Next Steps

1. **Test email directly** using `/api/stripe/test-email`
2. **Set up Stripe CLI** to forward webhooks locally
3. **Check server logs** for detailed error messages
4. **Verify GoDaddy email** account is working

---

**Note:** In production, webhooks will work automatically. Local testing requires Stripe CLI to forward webhooks to your local server.
