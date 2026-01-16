# Environment Setup Guide

This guide walks you through setting up the environment configuration system for development and production.

## Step 1: Create Root `.env` File

Create a `.env` file in the project root:

```bash
echo "ENV_MODE=development" > .env
```

Or manually create `.env` with this content:
```env
# Root Environment Toggle
# Single toggle to switch between development and production environments
# Options: development | production
ENV_MODE=development
```

## Step 2: Create `.env.example` Templates

### Server `.env.example`

Create `server/.env.example` with this content:

```env
# Server Environment Variables Example
# Copy this file to .env.development or .env.production and fill in your values
# NEVER commit actual .env files to Git

# ========================================
# Server Configuration
# ========================================
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# ========================================
# Client/URL Configuration
# ========================================
# Development: http://localhost:5173
# Production: https://design2organize.net
CLIENT_URL=http://localhost:5173
DOMAIN_URL=http://localhost:5173
CORS_ORIGIN=http://localhost:5173
ALLOW_ALL_ORIGINS=false  # Set to true for network testing from other machines

# ========================================
# Supabase Configuration
# ========================================
SUPABASE_URL=your_supabase_url_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
SUPABASE_JWT_SECRET=your_supabase_jwt_secret_here

# ========================================
# Stripe Configuration
# ========================================
STRIPE_SECRET_KEY=your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here

# ========================================
# Email Configuration
# ========================================
# Option 1: Using Gmail (EMAIL_SERVICE only)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password_here

# Option 2: Using SMTP (EMAIL_HOST required)
# EMAIL_HOST=mail.design2organize.net
# EMAIL_PORT=465
# EMAIL_SECURE=true
# EMAIL_USER=support@design2organize.net
# EMAIL_PASS=your_email_password_here

EMAIL_DISPLAY_NAME=Design2Organize Support
```

### Client `.env.example`

Create `client/.env.example` with this content:

```env
# Client Environment Variables Example (VITE_ prefix required)
# Copy this file to .env.development or .env.production and fill in your values
# NEVER commit actual .env files to Git

# ========================================
# API Configuration
# ========================================
# Development: http://localhost:3000
# Production: https://design2organize.net
VITE_API_TARGET=http://localhost:3000

# ========================================
# Supabase Configuration
# ========================================
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# ========================================
# Stripe Configuration (Optional - for future use)
# ========================================
# VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key_here
```

## Step 3: Create Development Environment Files

Copy the `.env.example` files and create `.env.development` files:

```bash
# Copy server template
cp server/.env.example server/.env.development

# Copy client template
cp client/.env.example client/.env.development
```

## Step 4: Fill in Development Values

Edit `server/.env.development` and `client/.env.development` with your actual development values:

- Replace `your_supabase_url_here` with your Supabase URL
- Replace `your_supabase_service_role_key_here` with your Supabase service role key
- Replace `your_stripe_secret_key_here` with your Stripe test secret key
- Replace `your_email@gmail.com` with your development email
- Replace `your_app_password_here` with your Gmail app password
- And so on...

## Step 5: Sync Environment Files

Run the environment sync script to copy `.env.development` to `.env`:

```bash
npm run env:sync
```

This will:
- Read `ENV_MODE` from root `.env` (should be `development`)
- Copy `server/.env.development` to `server/.env`
- Copy `client/.env.development` to `client/.env`

## Step 6: Test Development Setup

Start the development servers:

```bash
npm run dev
```

This will:
1. Run `npm run env:sync` automatically
2. Start the server on port 3000
3. Start the client on port 5173

Verify:
- ✅ Server starts without errors
- ✅ Client loads in browser
- ✅ API requests work
- ✅ Supabase authentication works
- ✅ Environment variables are loaded correctly

## Step 7: Create Production Environment Files (Optional)

When ready for production:

```bash
# Copy templates for production
cp server/.env.example server/.env.production
cp client/.env.example client/.env.production

# Edit with production values
# - Use production URLs (https://design2organize.net)
# - Use production Stripe keys (LIVE keys)
# - Use GoDaddy SMTP settings
# - Use production Supabase credentials
```

Switch to production mode:

```bash
# Change root .env to production
echo "ENV_MODE=production" > .env

# Sync production files
npm run env:sync

# Build for production
npm run build
```

## Quick Reference Commands

```bash
# Switch to development mode
npm run env:dev

# Switch to production mode
npm run env:prod

# Manual environment sync
npm run env:sync

# Check current environment
npm run env:check
```

## Environment File Structure

```
project-root/
├── .env                      # Root toggle: ENV_MODE=development|production
├── server/
│   ├── .env.example          # Template (committed to Git)
│   ├── .env.development      # Development values (gitignored)
│   ├── .env.production       # Production values (gitignored)
│   └── .env                  # Active env (gitignored, synced from above)
└── client/
    ├── .env.example          # Template (committed to Git)
    ├── .env.development      # Development values (gitignored)
    ├── .env.production       # Production values (gitignored)
    └── .env                  # Active env (gitignored, synced from above)
```

## Troubleshooting

### "ENV_MODE not found"
- Ensure root `.env` file exists with `ENV_MODE=development`

### "Environment file not found"
- Run `npm run env:sync` to create `.env` files from `.env.development`

### "Environment variables not loading"
- Check that `.env.development` files exist
- Verify values are filled in (not template placeholders)
- Run `npm run env:sync` to update `.env` files

### "CORS errors"
- Set `ALLOW_ALL_ORIGINS=true` in `server/.env.development` for network testing
- Or add your IP address to `CORS_ORIGIN`

## Next Steps

After environment setup:
1. ✅ Test development environment works
2. ✅ Commit `.env.example` files to Git
3. ✅ Ensure `.env` and `.env.development` files are gitignored
4. ✅ Document production environment setup
5. ✅ Set up branch protection rules on GitHub

---

**Note**: Never commit actual `.env` files with real values to Git. Only `.env.example` templates should be committed.
