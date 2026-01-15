# HTTP Deployment Configuration (No SSL)

## Important Notes

⚠️ **Stripe Webhooks Limitation**: Stripe webhooks **require HTTPS** for security. Since you're using HTTP only, you have two options:

1. **Use Stripe CLI for local webhook testing** (development only)
2. **Set up HTTPS later** (recommended for production)

For now, payment processing will work, but webhooks may not work until HTTPS is configured.

## Updated Configuration

### Domain URLs
- **Domain**: `http://design2organize.net` (no SSL)
- All references updated from `https://` to `http://`

### Email Configuration
- **Email**: `support@design2organize.net`
- Configured for cPanel email (SMTP) or Gmail SMTP

## Environment Variables for HTTP

Update your `.env` file with these values:

```env
# Domain Configuration (HTTP - no SSL)
DOMAIN_URL=http://design2organize.net
CLIENT_URL=http://design2organize.net
CORS_ORIGIN=http://design2organize.net

# Email Configuration (cPanel Email)
EMAIL_HOST=mail.design2organize.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password
```

## Stripe Webhook Setup

Since Stripe requires HTTPS for webhooks, you have these options:

### Option 1: Skip Webhooks for Now
- Payment processing will still work
- Order confirmation emails may not send automatically
- You'll need to manually process orders

### Option 2: Use Stripe CLI (Development Only)
```bash
stripe listen --forward-to http://design2organize.net/api/stripe/webhook
```
This is only for local development/testing.

### Option 3: Set Up HTTPS Later (Recommended)
Once you set up SSL/HTTPS:
1. Update all URLs to `https://`
2. Configure Stripe webhook: `https://design2organize.net/api/stripe/webhook`
3. Update environment variables

## Email Setup

### For cPanel Email (support@design2organize.net)

1. **Create email account in cPanel:**
   - Go to cPanel → Email Accounts
   - Create: `support@design2organize.net`
   - Set a password

2. **Get SMTP settings:**
   - Host: `mail.design2organize.net` (or check cPanel email settings)
   - Port: `465` (SSL) or `587` (TLS)
   - Secure: `true` for port 465, `false` for port 587

3. **Environment variables:**
   ```env
   EMAIL_HOST=mail.design2organize.net
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=support@design2organize.net
   EMAIL_PASS=your_email_password
   ```

### Alternative: Gmail SMTP (if preferred)

If you want to use Gmail SMTP with support@design2organize.net:

1. **Use Gmail SMTP:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=support@design2organize.net
   EMAIL_PASS=your-16-char-app-password
   ```

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Generate password for "Mail"
   - Use the 16-character password

## Supabase Configuration

Update Supabase redirect URLs to use HTTP:

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Add redirect URLs:
   ```
   http://design2organize.net
   http://design2organize.net/**
   ```
3. Update Site URL to: `http://design2organize.net`

## Testing

1. **Test website:** `http://design2organize.net`
2. **Test email:** Send a test email to verify configuration
3. **Test payment:** Complete a test order (webhooks won't work without HTTPS)

## Next Steps

1. ✅ Deploy with HTTP configuration
2. ⚠️ Test payment processing (webhooks limited)
3. 📧 Test email sending
4. 🔒 **Plan to set up HTTPS/SSL** for production (required for Stripe webhooks)

## SSL/HTTPS Setup (Future)

When ready to add SSL:

1. **In cPanel:**
   - Go to SSL/TLS Status
   - Install Let's Encrypt certificate (free)
   - Enable "Force HTTPS Redirect"

2. **Update environment variables:**
   - Change all `http://` to `https://`
   - Update Stripe webhook URL
   - Update Supabase redirect URLs
   - Restart application

3. **Update Stripe:**
   - Configure webhook: `https://design2organize.net/api/stripe/webhook`
   - Test webhook delivery
