# Email Not Sending - Debugging Steps

## Quick Test: Run Email Debug Script

1. **Run the debug script:**
   ```bash
   cd /Users/rammaradolla/drawer-organizer
   node server/test-email-debug.js your-test-email@gmail.com
   ```

   This will:
   - Check your email configuration
   - Test SMTP connection
   - Send a test email

2. **Check the output:**
   - ✅ If it says "CONNECTION SUCCESSFUL" and "EMAIL SENT" → Configuration is correct
   - ❌ If it shows errors → Follow the error messages

## Step-by-Step Debugging

### Step 1: Verify `.env` File Location

Make sure your `.env` file is in the `server/` directory:
```
drawer-organizer/
└── server/
    ├── .env          ← Should be here
    ├── app.js
    └── ...
```

### Step 2: Check `.env` File Contents

Your `server/.env` should have:

```env
# GoDaddy Email Configuration
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_actual_password_here
```

**Important:**
- ✅ Use the actual password for `support@design2organize.net`
- ✅ No quotes around values
- ✅ No spaces around `=`

### Step 3: Test Email Configuration

**Option A: Use the debug script (recommended):**
```bash
node server/test-email-debug.js your-email@gmail.com
```

**Option B: Use the API endpoint:**
```bash
curl -X POST http://localhost:3000/api/stripe/test-email \
  -H "Content-Type: application/json" \
  -d '{"toEmail": "your-email@gmail.com"}'
```

### Step 4: Check Common GoDaddy Issues

#### Issue 1: Port 465 Not Working
Try port 587 instead:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_password
```

#### Issue 2: Authentication Failed
- Verify email password is correct
- Check email account exists in GoDaddy
- Ensure SMTP is enabled for the email account

#### Issue 3: Connection Timeout
- Check firewall isn't blocking ports 465/587
- Verify GoDaddy email account is active
- Try different port (587 vs 465)

### Step 5: Verify GoDaddy Email Account

1. **Log in to GoDaddy:**
   - Go to: https://sso.godaddy.com
   - Navigate to Email & Office Dashboard

2. **Check email account:**
   - Verify `support@design2organize.net` exists
   - Test logging into webmail
   - Verify password is correct

3. **Check SMTP settings:**
   - SMTP server: `smtpout.secureserver.net`
   - Port: `465` (SSL) or `587` (TLS)
   - Authentication: Required

### Step 6: Check Server Logs

When you try to send an email, check your server console for:

**Success:**
```
[Order Confirmation Email] Successfully sent confirmation email
```

**Errors:**
```
[Order Confirmation Email] Email service not configured
→ Fix: Check EMAIL_USER and EMAIL_PASS in .env

Error: Invalid login: 535 Authentication failed
→ Fix: Check email password is correct

Error: Connection timeout
→ Fix: Check EMAIL_HOST and EMAIL_PORT
```

## Common Error Messages & Solutions

### "Email service not configured"
**Problem:** `EMAIL_USER` or `EMAIL_PASS` not set

**Solution:**
1. Check `server/.env` file exists
2. Verify both variables are set
3. Restart server after changing `.env`

### "535 Authentication failed"
**Problem:** Wrong email password or username

**Solution:**
1. Verify password in GoDaddy email settings
2. Check `EMAIL_USER` is full email: `support@design2organize.net`
3. Try resetting email password in GoDaddy

### "Connection timeout" or "ECONNREFUSED"
**Problem:** Wrong SMTP host or port

**Solution:**
1. Verify `EMAIL_HOST=smtpout.secureserver.net`
2. Try port `587` instead of `465`
3. Check firewall isn't blocking ports

### "Email sent but not received"
**Problem:** Email might be in spam or wrong recipient

**Solution:**
1. Check spam/junk folder
2. Verify recipient email is correct
3. Check GoDaddy email account for bounces
4. Add SPF record to DNS (see GODADDY_EMAIL_CONFIG.md)

## Quick Fix Checklist

- [ ] `.env` file is in `server/` directory
- [ ] `EMAIL_HOST=smtpout.secureserver.net`
- [ ] `EMAIL_PORT=465` (or `587` if 465 doesn't work)
- [ ] `EMAIL_SECURE=true` (or `false` for port 587)
- [ ] `EMAIL_USER=support@design2organize.net` (full email)
- [ ] `EMAIL_PASS` is the actual password (no quotes)
- [ ] Server restarted after changing `.env`
- [ ] GoDaddy email account exists and is active
- [ ] Test email script runs successfully
- [ ] Check spam folder for test emails

## Next Steps

1. **Run the debug script first:**
   ```bash
   node server/test-email-debug.js your-email@gmail.com
   ```

2. **Share the output** - The script will tell you exactly what's wrong

3. **If connection fails:**
   - Check GoDaddy email account
   - Try port 587
   - Verify credentials

4. **If connection succeeds but email not received:**
   - Check spam folder
   - Verify recipient email
   - Check GoDaddy email logs

---

**Run this command to start debugging:**
```bash
node server/test-email-debug.js your-email@gmail.com
```
