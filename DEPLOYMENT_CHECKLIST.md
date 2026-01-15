# Deployment Checklist for design2organize.net

Use this checklist to ensure everything is configured correctly before and after deployment.

## Pre-Deployment (Local)

### Code Preparation
- [ ] All code committed to Git
- [ ] Code tested locally
- [ ] Client built successfully: `npm run build:client`
- [ ] `client/dist` folder exists and contains files
- [ ] No console errors in browser
- [ ] No server errors in terminal

### Environment Variables
- [ ] Created `server/.env.example` file
- [ ] All production values ready (not test/development values)
- [ ] Stripe LIVE keys ready (not test keys)
- [ ] Gmail App Password generated
- [ ] Supabase credentials ready

### External Services
- [ ] Stripe account set up with live mode enabled
- [ ] Supabase project created and configured
- [ ] Gmail account ready with App Password
- [ ] Domain DNS configured (if needed)

## Deployment (cPanel)

### File Upload
- [ ] All files uploaded to cPanel
- [ ] File structure correct (server/, client/, package.json)
- [ ] `client/dist` folder uploaded (or built on server)
- [ ] File permissions correct (644 for files, 755 for directories)

### Node.js Application Setup
- [ ] Node.js application created in cPanel
- [ ] Node.js version selected (18.x or 20.x recommended)
- [ ] Application root path set correctly
- [ ] Startup file set to: `server/app.js`
- [ ] Application mode: Production

### Environment Variables (in cPanel)
- [ ] `NODE_ENV=production`
- [ ] `DOMAIN_URL=http://design2organize.net`
- [ ] `CLIENT_URL=http://design2organize.net`
- [ ] `CORS_ORIGIN=http://design2organize.net`
- [ ] `SUPABASE_URL` (correct value)
- [ ] `SUPABASE_ANON_KEY` (correct value)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (correct value)
- [ ] `STRIPE_SECRET_KEY` (LIVE key, starts with `sk_live_`)
- [ ] `STRIPE_WEBHOOK_SECRET` (correct value)
- [ ] `EMAIL_SERVICE=gmail`
- [ ] `EMAIL_USER` (correct email)
- [ ] `EMAIL_PASS` (16-char App Password)

### Dependencies
- [ ] Server dependencies installed: `cd server && npm install --production`
- [ ] No installation errors
- [ ] All required packages installed

### SSL/HTTPS
- [ ] SSL certificate installed (Let's Encrypt or other)
- [ ] HTTPS redirect enabled
- [ ] Domain accessible via http://design2organize.net

## External Service Configuration

### Stripe
- [ ] Webhook endpoint created: `http://design2organize.net/api/stripe/webhook`
- [ ] Webhook events selected:
  - [ ] `checkout.session.completed`
  - [ ] Any other required events
- [ ] Webhook secret copied to cPanel environment variables
- [ ] Test webhook delivery (use Stripe CLI or test payment)

### Supabase
- [ ] Redirect URLs updated:
  - [ ] `http://design2organize.net`
  - [ ] `http://design2organize.net/**`
- [ ] Site URL updated to: `http://design2organize.net`
- [ ] Authentication providers configured (Google OAuth)
- [ ] Database tables created and migrations run

### Gmail
- [ ] App Password generated: https://myaccount.google.com/apppasswords
- [ ] App Password saved securely
- [ ] 2-Step Verification enabled (required for App Password)

## Application Startup

### Starting the Application
- [ ] Application started in cPanel Node.js Selector
- [ ] No startup errors in logs
- [ ] Application shows as "Running" in cPanel
- [ ] Port assigned correctly (visible in cPanel)

### Logs Check
- [ ] Application logs accessible
- [ ] No error messages in logs
- [ ] Startup messages visible (e.g., "Server running on...")

## Post-Deployment Testing

### Basic Functionality
- [ ] Website loads: http://design2organize.net
- [ ] No console errors in browser
- [ ] Home page displays correctly
- [ ] Logo/images load correctly
- [ ] Navigation works

### Authentication
- [ ] Can sign in with Google
- [ ] Redirects work correctly after sign-in
- [ ] User profile loads
- [ ] Can sign out

### Core Features
- [ ] Can create drawer design
- [ ] 2D canvas works
- [ ] 3D preview works
- [ ] Can add design to cart
- [ ] Cart displays correctly
- [ ] Can proceed to checkout

### Payment (Stripe)
- [ ] Checkout page loads
- [ ] Address forms work
- [ ] Stripe payment form appears
- [ ] Can complete test payment
- [ ] Payment redirects to success page
- [ ] Order confirmation email received

### Email
- [ ] Order confirmation emails send
- [ ] Email arrives in inbox (check spam)
- [ ] Email content is correct
- [ ] Email includes order details

### Admin/Operations (if applicable)
- [ ] Admin login works
- [ ] Dashboard accessible
- [ ] Order management works
- [ ] User management works

## Monitoring & Maintenance

### Logs Monitoring
- [ ] Know where to find application logs
- [ ] Know where to find error logs
- [ ] Know where to find access logs
- [ ] Set up log rotation (if needed)

### Backup
- [ ] Environment variables backed up (securely)
- [ ] Code backed up (Git repository)
- [ ] Database backups configured (Supabase)
- [ ] Backup strategy documented

### Performance
- [ ] Application loads quickly
- [ ] No memory leaks (monitor over time)
- [ ] API responses are fast
- [ ] Images optimized

## Troubleshooting Resources

- [ ] Read CPANEL_DEPLOYMENT_GUIDE.md
- [ ] Know how to restart application
- [ ] Know how to view logs
- [ ] Know how to update environment variables
- [ ] Have contact info for hosting support
- [ ] Have Stripe support access
- [ ] Have Supabase support access

## Quick Commands Reference

```bash
# Build client locally
npm run build:client

# Build everything locally
npm run build:all

# Check if client/dist exists
ls -la client/dist

# Test locally (production build)
cd client && npm run preview
cd server && NODE_ENV=production npm start
```

## Notes

- Keep this checklist updated as you deploy
- Check off items as you complete them
- Note any issues or deviations from the plan
- Save this checklist for future deployments

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Application URL:** http://design2organize.net  
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete | ⬜ Issues Found
