# Quick Start: HTTP Deployment (No SSL)

## Summary of Changes

✅ **Domain**: `http://design2organize.net` (HTTP, no SSL)  
✅ **Email**: `support@design2organize.net` (cPanel email)  
✅ **Code Updated**: Server configured for HTTP, email service supports SMTP

## Important: Stripe Webhooks

⚠️ **Stripe webhooks require HTTPS**. Since you're using HTTP, webhooks won't work until you set up SSL.

**Current Status:**
- ✅ Payment processing works
- ⚠️ Order confirmation emails may not send automatically (webhooks disabled)
- ✅ Manual order processing works

## Environment Variables (Quick Copy)

```env
NODE_ENV=production
PORT=3000
DOMAIN_URL=http://design2organize.net
CLIENT_URL=http://design2organize.net
CORS_ORIGIN=http://design2organize.net

SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

STRIPE_SECRET_KEY=sk_live_your_live_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# GoDaddy Email (support@design2organize.net)
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password
```

## Email Setup (cPanel)

1. **Create email account in cPanel:**
   - Go to: cPanel → Email Accounts
   - Create: `support@design2organize.net`
   - Set password

2. **Get SMTP settings:**
   - Host: `mail.design2organize.net` (check in cPanel email settings)
   - Port: `465` (SSL) or `587` (TLS)
   - Secure: `true` for port 465

3. **Alternative: Use Gmail SMTP**
   If you prefer Gmail:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=support@design2organize.net
   EMAIL_PASS=your-16-char-app-password
   ```

## Next Steps

1. ✅ Follow `CPANEL_DEPLOYMENT_GUIDE.md` for deployment
2. ✅ Use HTTP URLs (already updated in guide)
3. ✅ Configure email with support@design2organize.net
4. ⚠️ Note: Stripe webhooks need HTTPS (can set up later)

## Files Updated

- ✅ `server/services/emailService.js` - Supports SMTP (cPanel email)
- ✅ `server/config/ports.js` - Uses HTTP in production
- ✅ `CPANEL_DEPLOYMENT_GUIDE.md` - Updated for HTTP
- ✅ `HTTP_DEPLOYMENT_UPDATE.md` - Detailed HTTP configuration notes

## When Ready for HTTPS

1. Install SSL certificate in cPanel (Let's Encrypt - free)
2. Update all URLs from `http://` to `https://`
3. Configure Stripe webhook: `https://design2organize.net/api/stripe/webhook`
4. Update Supabase redirect URLs to HTTPS
5. Restart application

See `HTTP_DEPLOYMENT_UPDATE.md` for more details.
