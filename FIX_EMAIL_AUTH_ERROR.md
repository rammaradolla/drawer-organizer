# Fix Email Authentication Error (535 Authentication Rejected)

## Error You're Seeing

```
Error: Invalid login: 535 ...authentication rejected
code: 'EAUTH'
responseCode: 535
command: 'AUTH PLAIN'
```

This means your GoDaddy email credentials or SMTP settings are incorrect.

## Quick Fix Steps

### Step 1: Verify GoDaddy Email Account

1. **Log in to GoDaddy:**
   - Go to: https://sso.godaddy.com
   - Navigate to **Email & Office Dashboard**

2. **Check email account exists:**
   - Verify `support@design2organize.net` exists
   - Test logging into webmail to confirm password works

3. **Reset password if needed:**
   - If you're not sure of the password, reset it in GoDaddy
   - Use the new password in your `.env` file

### Step 2: Check Your `.env` File

Your `server/.env` should have:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_actual_password_here
```

**Important:**
- ✅ Use the **full email address** for `EMAIL_USER`
- ✅ Use the **actual password** (not a token or app password)
- ✅ No quotes around values
- ✅ No spaces around `=`

### Step 3: Try Port 587 (Alternative)

If port 465 doesn't work, try port 587:

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_password
```

**Note:** `EMAIL_SECURE=false` for port 587 (TLS), `true` for port 465 (SSL)

### Step 4: Run Email Debug Script

Test your configuration:

```bash
cd /Users/rammaradolla/drawer-organizer
node server/test-email-debug.js your-test-email@gmail.com
```

This will:
- Show your exact configuration
- Test SMTP connection
- Show specific error if authentication fails

### Step 5: Common GoDaddy Issues

#### Issue 1: Wrong Password
**Solution:**
- Reset password in GoDaddy email dashboard
- Update `EMAIL_PASS` in `.env`
- Restart server

#### Issue 2: Email Account Not Activated
**Solution:**
- Log into GoDaddy email webmail
- Verify account is active
- Check email account status in GoDaddy dashboard

#### Issue 3: SMTP Not Enabled
**Solution:**
- GoDaddy email accounts have SMTP enabled by default
- If disabled, enable it in email account settings

#### Issue 4: Wrong SMTP Host
**Solution:**
- For GoDaddy: Use `smtpout.secureserver.net`
- NOT `mail.design2organize.net` (that's for cPanel)
- NOT `smtp.gmail.com` (that's for Gmail)

### Step 6: Verify Configuration

After updating `.env`, restart your server:

```bash
# Stop server (Ctrl+C)
# Then restart
npm run server:dev
```

## Testing After Fix

1. **Run debug script:**
   ```bash
   node server/test-email-debug.js your-email@gmail.com
   ```

2. **Complete a test order** - Email should send automatically

3. **Check server logs** for:
   ```
   [Order Confirmation Email] Successfully sent confirmation email
   ```

## Alternative: Use Gmail SMTP (If GoDaddy Doesn't Work)

If GoDaddy SMTP continues to fail, you can use Gmail temporarily:

```env
# Remove EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE
EMAIL_SERVICE=gmail
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-16-char-app-password
```

**To get Gmail App Password:**
1. Enable 2-Step Verification: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Use the 16-character password (not your regular password)

## Quick Checklist

- [ ] Email account `support@design2organize.net` exists in GoDaddy
- [ ] Password is correct (test by logging into webmail)
- [ ] `EMAIL_USER=support@design2organize.net` (full email)
- [ ] `EMAIL_PASS` is the actual password (not app password)
- [ ] `EMAIL_HOST=smtpout.secureserver.net` (GoDaddy SMTP)
- [ ] `EMAIL_PORT=465` or `587`
- [ ] `EMAIL_SECURE=true` for 465, `false` for 587
- [ ] Server restarted after changing `.env`
- [ ] Debug script runs successfully

---

**Most Common Issue:** Wrong password or email account not activated in GoDaddy.

**Quick Test:** Log into GoDaddy webmail with the same credentials to verify they work.
