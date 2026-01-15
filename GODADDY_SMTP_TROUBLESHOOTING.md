# GoDaddy SMTP Authentication Troubleshooting

## Problem: Can Login to Email But SMTP Fails

If you can log into GoDaddy webmail but SMTP authentication fails, try these solutions:

## Solution 1: Try Port 587 with TLS

GoDaddy sometimes works better with port 587 (TLS) instead of 465 (SSL):

```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_password
```

**Key difference:** `EMAIL_SECURE=false` for port 587 (TLS), `true` for port 465 (SSL)

## Solution 2: Verify Password Format

Make sure your password in `.env`:
- ✅ Has no extra spaces before or after
- ✅ Has no quotes around it
- ✅ Is exactly the same as webmail password
- ✅ No special characters that need escaping

**Example:**
```env
# ✅ Correct
EMAIL_PASS=MyPassword123

# ❌ Wrong (quotes)
EMAIL_PASS="MyPassword123"

# ❌ Wrong (spaces)
EMAIL_PASS = MyPassword123
```

## Solution 3: Check GoDaddy Email Settings

1. **Log into GoDaddy Email Dashboard:**
   - Go to: https://sso.godaddy.com
   - Navigate to Email & Office Dashboard
   - Select your email account

2. **Check SMTP Settings:**
   - SMTP should be enabled by default
   - Verify SMTP server: `smtpout.secureserver.net`
   - Port: 465 (SSL) or 587 (TLS)

3. **Check if SMTP Authentication is Required:**
   - Some GoDaddy plans require SMTP authentication
   - Make sure it's enabled in email account settings

## Solution 4: Try Alternative GoDaddy SMTP Hosts

Sometimes different SMTP hosts work:

**Option A (Primary):**
```env
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Option B (Alternative):**
```env
EMAIL_HOST=smtp.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
```

**Option C (If using Office 365/Exchange):**
```env
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Solution 5: Check for Special Characters in Password

If your password has special characters, they might need escaping:

1. **Try resetting password** to something simpler (letters and numbers only)
2. **Update password in GoDaddy**
3. **Update EMAIL_PASS in .env**
4. **Restart server**

## Solution 6: Enable Less Secure Apps (If Available)

Some email providers require "less secure apps" to be enabled:

1. Check GoDaddy email account settings
2. Look for "SMTP Authentication" or "Less Secure Apps"
3. Enable if available

## Solution 7: Test with Debug Script

Run the debug script to see exact error:

```bash
node server/test-email-debug.js your-email@gmail.com
```

This will show:
- Exact SMTP configuration being used
- Specific authentication error
- Connection details

## Solution 8: Check Server Logs

After updating `.env`, restart server and check logs:

**On server startup, you should see:**
```
[Email Service] ✅ SMTP Configuration verified successfully
[Email Service] Ready to send emails from: support@design2organize.net
```

**If you see error:**
```
[Email Service] ❌ SMTP Configuration Error: ...
```
→ Check the error message for specific issue

## Common GoDaddy SMTP Issues

### Issue 1: Port 465 Blocked
**Solution:** Use port 587 instead

### Issue 2: TLS vs SSL
**Solution:** Port 587 uses TLS (`EMAIL_SECURE=false`), Port 465 uses SSL (`EMAIL_SECURE=true`)

### Issue 3: Password with Special Characters
**Solution:** Reset password to alphanumeric only, or ensure proper escaping

### Issue 4: Email Account Type
**Solution:** Verify you're using GoDaddy email (not Office 365 or other service)

## Quick Test Checklist

1. ✅ Can log into GoDaddy webmail
2. ✅ Password is correct
3. ✅ Tried port 587 with `EMAIL_SECURE=false`
4. ✅ Tried port 465 with `EMAIL_SECURE=true`
5. ✅ No quotes/spaces in `.env` values
6. ✅ Server restarted after changing `.env`
7. ✅ Debug script shows connection details
8. ✅ Server logs show SMTP verification status

## Next Steps

1. **Try port 587 first** (most common fix):
   ```env
   EMAIL_PORT=587
   EMAIL_SECURE=false
   ```

2. **Restart server**

3. **Run debug script:**
   ```bash
   node server/test-email-debug.js your-email@gmail.com
   ```

4. **Check server startup logs** for SMTP verification

5. **Complete a test order** and check if email sends

---

**Most Likely Fix:** Change to port 587 with `EMAIL_SECURE=false`
