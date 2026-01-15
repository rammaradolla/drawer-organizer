# GoDaddy Email Configuration for design2organize.net

## GoDaddy SMTP Settings

Since you purchased your domain and email from GoDaddy, use these SMTP settings:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password
```

## Alternative Port (if 465 doesn't work)

If port 465 doesn't work, try port 587 with TLS:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password
```

## Complete Environment Variables Block

Here's the complete email configuration block for your `.env` file:

```env
# GoDaddy Email Configuration (support@design2organize.net)
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password

# Optional: Customize display name
EMAIL_DISPLAY_NAME=Design2Organize Support
```

## Key Differences: GoDaddy vs cPanel

| Setting | GoDaddy | cPanel (if you switch later) |
|---------|---------|------------------------------|
| **SMTP Host** | `smtpout.secureserver.net` | `mail.design2organize.net` |
| **Port** | `465` (SSL) or `587` (TLS) | `465` (SSL) or `587` (TLS) |
| **Secure** | `true` for 465, `false` for 587 | `true` for 465, `false` for 587 |

## Setup Steps

1. **Create Email Account in GoDaddy:**
   - Log in to GoDaddy account
   - Go to Email & Office Dashboard
   - Create email: `support@design2organize.net`
   - Set a strong password

2. **Enable SMTP Authentication:**
   - Make sure SMTP authentication is enabled for your email account
   - This is usually enabled by default in GoDaddy

3. **Configure in Your Application:**
   - Use the environment variables above
   - Set `EMAIL_USER=support@design2organize.net`
   - Set `EMAIL_PASS` to the password you created

4. **Test Email Sending:**
   - Use the test endpoint: `POST /api/stripe/test-email`
   - Or complete a test order to trigger confirmation email

## Troubleshooting

### If Port 465 Doesn't Work:
- Try port `587` with `EMAIL_SECURE=false`
- Some networks block port 465

### If Authentication Fails:
- Verify email password is correct
- Check that SMTP authentication is enabled in GoDaddy
- Ensure you're using the full email address as username

### If Emails Go to Spam:
- Add SPF record in GoDaddy DNS settings
- SPF record should include: `v=spf1 include:secureserver.net ~all`
- This authorizes GoDaddy's servers to send emails for your domain

## SPF Record Configuration (Important for Deliverability)

To prevent emails from going to spam, add an SPF record in GoDaddy DNS:

1. Go to GoDaddy DNS Management
2. Add a TXT record:
   - **Type:** TXT
   - **Name:** @ (or leave blank)
   - **Value:** `v=spf1 include:secureserver.net ~all`
   - **TTL:** 1 hour (or default)

This tells email servers that GoDaddy is authorized to send emails for your domain.

## Notes

- ✅ GoDaddy email works with the existing code (no code changes needed)
- ✅ The code automatically detects `EMAIL_HOST` and uses SMTP configuration
- ✅ All emails will be sent from `support@design2organize.net`
- ✅ Display name will be "Design2Organize Support"

---

**Last Updated:** 2026-01-12  
**Email Provider:** GoDaddy  
**SMTP Server:** smtpout.secureserver.net
