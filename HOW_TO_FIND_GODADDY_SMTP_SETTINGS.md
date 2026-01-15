# How to Find GoDaddy Email SMTP Settings

## Step-by-Step Guide to Find SMTP Settings in GoDaddy

### Step 1: Log into GoDaddy

1. Go to: https://sso.godaddy.com
2. Log in with your GoDaddy account credentials

### Step 2: Navigate to Email Dashboard

1. After logging in, look for **"Email & Office Dashboard"** or **"Email"** in the main menu
2. Click on it to open the email management section

### Step 3: Access Email Account Settings

1. You should see a list of your email accounts
2. Find and click on **`support@design2organize.net`**
3. Look for **"Settings"**, **"Email Settings"**, or **"Account Settings"** option
4. Click on it

### Step 4: Find SMTP Settings

Look for one of these sections:
- **"Email Client Settings"**
- **"SMTP Settings"**
- **"Outgoing Mail Server"**
- **"Server Settings"**
- **"Mail Client Configuration"**

### Step 5: Check SMTP Information

You should see information like:

**SMTP Server/Host:**
- Usually: `smtpout.secureserver.net` or `smtp.secureserver.net`
- This is your **EMAIL_HOST**

**SMTP Port:**
- Usually: `465` (SSL) or `587` (TLS)
- This is your **EMAIL_PORT**

**Security/Encryption:**
- **SSL** (for port 465) → `EMAIL_SECURE=true`
- **TLS** (for port 587) → `EMAIL_SECURE=false`
- This determines your **EMAIL_SECURE** setting

**Authentication:**
- Should be **"Required"** or **"Enabled"**
- Username: Your full email address (`support@design2organize.net`)
- Password: Your email account password

## Alternative: Check via Email Client Setup

If you can't find SMTP settings in the dashboard:

### Method 1: Outlook/Email Client Setup

1. In GoDaddy Email Dashboard, look for **"Set up email client"** or **"Email Client Setup"**
2. This usually shows the SMTP settings needed for email clients
3. Look for **"Outgoing Mail Server (SMTP)"** section

### Method 2: Help/Support Documentation

1. In GoDaddy, look for **"Help"** or **"Support"**
2. Search for **"SMTP settings"** or **"email server settings"**
3. This should show the standard GoDaddy SMTP configuration

## Standard GoDaddy SMTP Settings

Based on GoDaddy's standard configuration:

### For SSL (Port 465):
```
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=465
EMAIL_SECURE=true
```

### For TLS (Port 587) - Recommended:
```
EMAIL_HOST=smtpout.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
```

### Alternative SMTP Host (if smtpout doesn't work):
```
EMAIL_HOST=smtp.secureserver.net
EMAIL_PORT=587
EMAIL_SECURE=false
```

## What to Look For in GoDaddy Dashboard

When you're in the email settings, you should see something like:

**Outgoing Mail Server (SMTP):**
- Server: `smtpout.secureserver.net`
- Port: `587` or `465`
- Security: `TLS` or `SSL`
- Authentication: `Required`
- Username: `support@design2organize.net`
- Password: `[your password]`

## Quick Reference

| Setting | What to Look For | Common Values |
|---------|-----------------|---------------|
| **EMAIL_HOST** | SMTP Server / Outgoing Mail Server | `smtpout.secureserver.net` or `smtp.secureserver.net` |
| **EMAIL_PORT** | SMTP Port | `587` (TLS) or `465` (SSL) |
| **EMAIL_SECURE** | Security Type | `false` for TLS (587), `true` for SSL (465) |
| **EMAIL_USER** | Username / Email Address | `support@design2organize.net` |
| **EMAIL_PASS** | Password | Your email account password |

## If You Can't Find SMTP Settings

1. **Contact GoDaddy Support:**
   - They can provide the exact SMTP settings for your account
   - Ask: "What are the SMTP settings for support@design2organize.net?"

2. **Check Email Plan Type:**
   - Different GoDaddy email plans may have different SMTP servers
   - Office 365 email uses: `smtp.office365.com`
   - GoDaddy Workspace email uses: `smtpout.secureserver.net`

3. **Try Standard Settings:**
   - Most GoDaddy accounts use: `smtpout.secureserver.net` port `587`
   - This is what you currently have configured

## Testing Your Settings

After finding the settings in GoDaddy:

1. **Update your `.env` file** with the exact values from GoDaddy
2. **Run the debug script:**
   ```bash
   node server/test-email-debug.js your-email@gmail.com
   ```
3. **Check if connection works**

## Visual Guide Locations

In GoDaddy Email Dashboard, SMTP settings are typically found in:
- **Settings** → **Email Settings** → **SMTP**
- **Account Settings** → **Mail Client Configuration**
- **Help** → **Email Setup** → **SMTP Settings**

---

**Note:** If you're using GoDaddy's Office 365 email (not GoDaddy Workspace), the SMTP settings will be different:
- Host: `smtp.office365.com`
- Port: `587`
- Secure: `false` (TLS)
