# Email Debugging Guide

## Quick Diagnostic Steps

### 1. Check Email Service Configuration
```bash
curl http://localhost:3000/api/stripe/webhook-status
```

This will show:
- If email service is configured
- Which email account is being used (masked)
- Webhook configuration status

### 2. Test Email Sending Directly
```bash
curl -X POST http://localhost:3000/api/stripe/test-email \
  -H "Content-Type: application/json" \
  -d '{"toEmail": "your-test-email@gmail.com"}'
```

This will:
- Test if email service is working
- Show detailed error messages if it fails
- Send a test email to verify delivery

### 3. Test Order Confirmation Email
```bash
curl -X POST http://localhost:3000/api/stripe/test-order-email/YOUR_ORDER_ID
```

Replace `YOUR_ORDER_ID` with an actual order ID (e.g., `bb3520fc-a160-497c-b639-f38133aa014c`)

## Common Issues and Solutions

### Issue 1: Email Service Not Configured

**Symptoms:**
- `email_service_configured: false` in webhook-status
- Error: "Email service not configured"

**Solution:**
1. Create/update `server/.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

2. For Gmail, you need an App Password (not your regular password):
   - Enable 2-Step Verification: https://myaccount.google.com/security
   - Generate App Password: https://myaccount.google.com/apppasswords
   - Use the 16-character password in `EMAIL_PASS`

### Issue 2: Webhook Not Firing

**Symptoms:**
- Order status stays "Pending"
- No webhook logs in server console

**Solution:**
1. **For Local Testing:**
   ```bash
   # Install Stripe CLI if not installed
   brew install stripe/stripe-cli/stripe
   
   # Login to Stripe
   stripe login
   
   # Forward webhooks to local server
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

2. **For Production:**
   - Go to Stripe Dashboard > Developers > Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Enable event: `checkout.session.completed`
   - Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET` in `.env`

### Issue 3: Email Goes to Spam

**Symptoms:**
- Email sent successfully (logs show success)
- But email not in inbox

**Solution:**
- Check spam/junk folder
- Verify sender email address is correct
- Consider using a professional email service (SendGrid, Mailgun, etc.)

### Issue 4: Authentication Errors

**Symptoms:**
- Error: "Invalid login" or "Authentication failed"
- Error code: `EAUTH`

**Solution:**
- Verify you're using App Password, not regular password
- Check if 2-Step Verification is enabled
- Verify email address is correct
- Try regenerating App Password

## Server Log Messages to Look For

### Success Messages:
```
[Order Confirmation Email] Starting email send for order [order_id]
[Order Confirmation Email] Found user [email] for order [order_id]
[Order Confirmation Email] Attempting to send email to [email] for order [order_id]
[Order Confirmation Email] Successfully sent confirmation email to [email] for order [order_id]
[Stripe Webhook] Order confirmation email sent for order [order_id]
```

### Error Messages:
```
[Order Confirmation Email] Email service not configured. EMAIL_USER: false, EMAIL_PASS: false
[Order Confirmation Email] No user or email found for order [order_id]
[Order Confirmation Email] Error sending confirmation email for order [order_id]: [error details]
[Stripe Webhook] Failed to send order confirmation email for order [order_id]
```

## Testing Checklist

- [ ] Email service configured in `.env`
- [ ] Test email endpoint works (`/api/stripe/test-email`)
- [ ] Webhook status shows email configured
- [ ] Stripe webhook is set up (local or production)
- [ ] Server logs show webhook events
- [ ] Order status changes from "Pending" to "In Progress"
- [ ] Email appears in inbox (check spam folder)

## Environment Variables Required

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... (for testing)
STRIPE_WEBHOOK_SECRET=whsec_... (from Stripe Dashboard)

# Server Configuration
CLIENT_URL=http://localhost:5173
PORT=3000
```

## Next Steps

1. Run the diagnostic endpoints above
2. Check server console logs
3. Verify `.env` file configuration
4. Test email sending with the test endpoint
5. Check Stripe Dashboard for webhook events
