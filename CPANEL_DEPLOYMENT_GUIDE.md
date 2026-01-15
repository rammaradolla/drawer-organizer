# cPanel Deployment Guide for design2organize.net

This guide will walk you through deploying your Drawer Organizer application to cPanel hosting.

## Prerequisites

✅ Domain: design2organize.net  
✅ cPanel hosting account with Node.js support  
✅ Access to cPanel dashboard  
✅ All environment variables ready (Supabase, Stripe, Email)

## Overview

Your application consists of:
- **Frontend (Client)**: React/Vite application
- **Backend (Server)**: Node.js/Express API server
- **Database**: Supabase (external, no setup needed)
- **Payment**: Stripe (external, configure webhooks)
- **Email**: Gmail/NodeMailer

## Step-by-Step Deployment

### Step 1: Prepare Your Code Locally

1. **Build the client for production:**
   ```bash
   cd /Users/rammaradolla/drawer-organizer
   cd client
   npm run build
   ```
   This creates a `client/dist` folder with production-ready files.

2. **Verify the build:**
   ```bash
   ls -la client/dist
   ```
   You should see `index.html` and assets folder.

### Step 2: Access cPanel

1. Log in to your cPanel account
2. Look for **"Node.js Selector"** or **"Setup Node.js App"** in the Software section
3. If you don't see it, contact your hosting provider to enable Node.js support

### Step 3: Create Node.js Application in cPanel

1. Click **"Setup Node.js App"** or **"Create Application"**
2. Fill in the application details:
   - **Node.js Version**: Select latest LTS version (18.x or 20.x)
   - **Application Mode**: Production
   - **Application Root**: `drawer-organizer` (or your preferred name)
   - **Application URL**: Leave default (usually matches domain)
   - **Application Startup File**: `server/app.js`
   - **Application Port**: Leave blank (cPanel assigns automatically)

3. Click **"Create"** or **"Setup"**

4. **Note the following information** (you'll need it later):
   - Application URL (e.g., `http://design2organize.net`)
   - Port number assigned by cPanel
   - Path to your application root

### Step 4: Upload Your Files

You have two options:

#### Option A: Using cPanel File Manager (Recommended for first-time)

1. Go to **"File Manager"** in cPanel
2. Navigate to your application root (e.g., `public_html/drawer-organizer` or as created in Step 3)
3. **Upload files:**
   - Upload the entire project folder structure
   - OR use File Manager's "Upload" button to upload a ZIP file, then extract it

4. **File structure should be:**
   ```
   drawer-organizer/
   ├── server/
   │   ├── app.js
   │   ├── package.json
   │   ├── .env (you'll create this)
   │   └── ... (all server files)
   ├── client/
   │   ├── dist/ (built files from Step 1)
   │   ├── package.json
   │   └── ... (source files, but dist is what matters)
   └── package.json
   ```

#### Option B: Using Git (If you have SSH access)

1. In cPanel Terminal or via SSH:
   ```bash
   cd ~/your-app-root
   git clone https://github.com/rammaradolla/drawer-organizer.git .
   ```

2. Build the client:
   ```bash
   cd client
   npm install
   npm run build
   cd ..
   ```

### Step 5: Install Dependencies

1. In cPanel Node.js Selector, find your application
2. Click **"Terminal"** or use **"File Manager" → Terminal**
3. Navigate to your server directory:
   ```bash
   cd server
   npm install --production
   ```
   (Use `--production` to skip dev dependencies)

### Step 6: Configure Environment Variables

1. In cPanel Node.js Selector, find your application
2. Click **"Environment Variables"** or **"Settings"**
3. Add the following variables (click "Add Variable" for each):

   ```
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
   
   EMAIL_HOST=mail.design2organize.net
   EMAIL_PORT=465
   EMAIL_SECURE=true
   EMAIL_USER=support@design2organize.net
   EMAIL_PASS=your_email_password
   ```

   **Note:** For cPanel email, get SMTP settings from cPanel → Email Accounts. If using Gmail SMTP instead, use:
   ```
   EMAIL_SERVICE=gmail
   EMAIL_USER=support@design2organize.net
   EMAIL_PASS=your-16-char-app-password
   ```

4. **Important Notes:**
   - Use **LIVE** Stripe keys (not test keys)
   - For cPanel email: Get SMTP settings from cPanel → Email Accounts
   - For Gmail: Get App Password from https://myaccount.google.com/apppasswords
   - Never commit `.env` file to Git

### Step 7: Configure Domain (HTTP - No SSL)

⚠️ **Note:** You're using HTTP (no SSL) for now. SSL/HTTPS is recommended for production but can be set up later.

1. Domain should point to your cPanel hosting
2. No SSL configuration needed for now
3. ⚠️ **Important:** Stripe webhooks require HTTPS. See Step 8 for details.

### Step 8: Configure Stripe Webhooks

⚠️ **Important Limitation:** Stripe webhooks **require HTTPS**. Since you're using HTTP, webhooks won't work until you set up SSL/HTTPS.

**Options:**
1. **Skip webhooks for now** (payment processing will work, but order confirmation emails may not send automatically)
2. **Use Stripe CLI for local testing** (development only)
3. **Set up HTTPS later** (recommended - see HTTP_DEPLOYMENT_UPDATE.md)

**If you plan to set up HTTPS later:**
1. Go to Stripe Dashboard: https://dashboard.stripe.com/webhooks
2. Click **"Add endpoint"**
3. Set endpoint URL: `http://design2organize.net/api/stripe/webhook` (will need to change to https:// later)
4. Select events to listen to:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - Any other events your app uses
5. Copy the **"Signing secret"** (starts with `whsec_`)
6. Add it to your environment variables in cPanel as `STRIPE_WEBHOOK_SECRET`

### Step 9: Configure Supabase

1. Go to Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Go to **Authentication → URL Configuration**
4. Add to **"Redirect URLs"**:
   ```
   http://design2organize.net
   http://design2organize.net/**
   ```
5. Update **"Site URL"** to: `http://design2organize.net`

### Step 10: Start/Restart the Application

1. In cPanel Node.js Selector, find your application
2. Click **"Restart App"** or **"Start"**
3. Check the logs for any errors:
   - Click **"View Logs"** or **"Error Logs"**
   - Look for startup messages

### Step 11: Test Your Application

1. Open browser: `http://design2organize.net`
2. Test basic functionality:
   - ✅ Home page loads
   - ✅ Can sign in with Google
   - ✅ Can create a design
   - ✅ Can add to cart
   - ✅ Can checkout with Stripe
   - ✅ Receive order confirmation email

### Step 12: Monitor Logs

1. In cPanel, check:
   - **Node.js Application Logs**
   - **Error Logs**
   - **Access Logs**

2. Common log locations:
   - Application logs: In Node.js Selector → "View Logs"
   - Error logs: cPanel → "Errors" section
   - Access logs: cPanel → "Metrics" → "Raw Access Logs"

## Troubleshooting

### Application Won't Start

1. **Check Node.js version compatibility:**
   - Your app requires Node.js 14+ (preferably 18+)
   - Verify in cPanel Node.js Selector

2. **Check environment variables:**
   - All required variables must be set
   - No typos or extra spaces
   - Use correct values (not placeholders)

3. **Check file permissions:**
   - Files should be readable (644)
   - Directories should be executable (755)
   - In File Manager, select files → "Change Permissions"

4. **Check startup file:**
   - Must be: `server/app.js`
   - File must exist and be readable

### 404 Errors on Routes

- The server is configured to serve `client/dist` in production
- Ensure `client/dist` folder exists and contains built files
- Restart the application after building

### CORS Errors

- Verify `CORS_ORIGIN` and `DOMAIN_URL` match your domain exactly
- Include `https://` prefix
- Restart application after changing environment variables

### Database Connection Errors

- Verify Supabase credentials are correct
- Check Supabase project is active
- Verify network access (Supabase should be publicly accessible)

### Stripe Webhook Failures

- Verify webhook URL is correct: `http://design2organize.net/api/stripe/webhook`
- Check webhook secret is correct in environment variables
- View Stripe Dashboard → Webhooks → Your endpoint → Logs

### Email Not Sending

- Verify Gmail App Password is correct (16 characters)
- Check email credentials in environment variables
- Verify Gmail account has "Less secure app access" enabled OR use App Password
- Check application logs for email errors

### Port Issues

- cPanel assigns ports automatically
- Your code uses `process.env.PORT` which cPanel sets automatically
- Don't hardcode port numbers

## Maintenance

### Updating Your Application

1. **Using File Manager:**
   - Upload new files
   - Rebuild client: `cd client && npm run build`
   - Restart application in Node.js Selector

2. **Using Git (if configured):**
   ```bash
   cd ~/your-app-root
   git pull
   cd client
   npm install
   npm run build
   cd ..
   cd server
   npm install --production
   ```
   - Restart application in Node.js Selector

### Viewing Application Logs

1. In Node.js Selector → "View Logs"
2. Or in Terminal:
   ```bash
   tail -f ~/logs/your-app-name.log
   ```

### Backup Recommendations

1. Backup your `.env` file (store securely, never in Git)
2. Backup your database (Supabase has built-in backups)
3. Backup your code (use Git)
4. Consider cPanel backup service

## Quick Reference

### Environment Variables Checklist

- [ ] `NODE_ENV=production`
- [ ] `DOMAIN_URL=http://design2organize.net`
- [ ] `CLIENT_URL=http://design2organize.net`
- [ ] `CORS_ORIGIN=http://design2organize.net`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `STRIPE_SECRET_KEY` (LIVE key)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `EMAIL_SERVICE=gmail`
- [ ] `EMAIL_USER`
- [ ] `EMAIL_PASS` (App Password)

### External Services to Configure

- [ ] Stripe Dashboard: Webhook endpoint
- [ ] Supabase Dashboard: Redirect URLs
- [ ] Gmail: App Password generated
- [ ] cPanel: SSL certificate installed
- [ ] Domain: DNS pointing to hosting

### File Structure

```
drawer-organizer/
├── server/
│   ├── app.js (startup file)
│   ├── package.json
│   ├── .env (create this)
│   └── ... (all server files)
├── client/
│   ├── dist/ (MUST exist - built files)
│   │   ├── index.html
│   │   └── assets/
│   └── ... (source files)
└── package.json
```

## Support

If you encounter issues:
1. Check application logs
2. Verify all environment variables
3. Test external services (Supabase, Stripe) separately
4. Contact hosting provider if Node.js issues persist
5. Check application code for errors

---

**Congratulations!** Your application should now be live at `http://design2organize.net` 🎉
