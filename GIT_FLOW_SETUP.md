# Git Flow Setup Complete

## ✅ What's Been Set Up

### 1. Git Branches
- **`master`**: Production-ready branch (current state of code)
- **`develop`**: Development branch (currently active)

### 2. Configuration Structure

```
project-root/
├── config/
│   ├── env.js                    # Centralized env config loader
│   ├── environments/
│   │   ├── development.js        # Development config structure
│   │   ├── production.js         # Production config structure
│   │   └── index.js              # Environment selector
├── scripts/
│   └── sync-env.js               # Environment sync script
└── .gitignore                    # Updated to exclude .env files
```

### 3. Environment Management

**Root `.env` file (to be created):**
```env
ENV_MODE=development
```

**Server `.env.example` (template - create manually):**
```env
# Copy this to .env.development or .env.production
PORT=3000
CLIENT_URL=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
STRIPE_SECRET_KEY=your_stripe_secret_key
EMAIL_USER=support@design2organize.net
# ... (see server/.env.example for full template)
```

**Client `.env.example` (template - create manually):**
```env
# Copy this to .env.development or .env.production
VITE_API_TARGET=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

## 📋 Next Steps

### Step 1: Create Root `.env` File
```bash
# Create root .env file
echo "ENV_MODE=development" > .env
```

### Step 2: Create `.env.example` Templates
Due to security restrictions, you'll need to create these files manually:

**Server `.env.example`:**
```bash
# Copy and fill in with your values
cp server/.env.example server/.env.development
# Edit server/.env.development with your actual values
```

**Client `.env.example`:**
```bash
# Copy and fill in with your values
cp client/.env.example client/.env.development
# Edit client/.env.development with your actual values
```

### Step 3: Sync Environment Files
```bash
# This will copy .env.development to .env in server/ and client/
npm run env:sync
```

### Step 4: Test Development Setup
```bash
# Start development servers (will auto-sync env first)
npm run dev
```

## 🚀 Usage

### Switch to Development Mode
```bash
npm run env:dev    # Sets ENV_MODE=development and syncs files
```

### Switch to Production Mode
```bash
npm run env:prod   # Sets ENV_MODE=production and syncs files
```

### Manual Environment Sync
```bash
npm run env:sync   # Syncs .env files based on current ENV_MODE
```

## 📝 Current Configuration

The current setup preserves your **development environment** configuration:

- **Server Port**: 3000
- **Client Port**: 5173
- **CORS**: Allows localhost and network testing (when `ALLOW_ALL_ORIGINS=true`)
- **Supabase**: Configured via environment variables
- **Stripe**: Configured via environment variables
- **Email**: Configured via environment variables (GoDaddy SMTP or Gmail)

## 🔄 Git Flow Workflow

### Daily Development
```bash
git checkout develop
# Make changes
git commit -m "feat: new feature"
git push origin develop
```

### Create Feature Branch
```bash
git checkout develop
git checkout -b feature/new-feature
# Develop feature
git commit -m "feat: new feature"
git checkout develop
git merge --no-ff feature/new-feature
git push origin develop
```

### Release to Production
```bash
# Create release branch
git checkout develop
git checkout -b release/v1.1.0

# Fix bugs only (no new features)
git commit -m "fix: bug fix"

# Merge to master
git checkout master
git merge --no-ff release/v1.1.0
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin master
git push origin v1.1.0

# Merge back to develop
git checkout develop
git merge --no-ff release/v1.1.0
git push origin develop

# Clean up
git branch -d release/v1.1.0
```

### Hotfix (Production Fix)
```bash
# Create hotfix from master
git checkout master
git checkout -b hotfix/critical-fix
# Fix the bug
git commit -m "fix: critical bug"

# Merge to master
git checkout master
git merge --no-ff hotfix/critical-fix
git tag -a v1.1.1 -m "Hotfix: critical bug"
git push origin master
git push origin v1.1.1

# Merge back to develop
git checkout develop
git merge --no-ff hotfix/critical-fix
git push origin develop

# Clean up
git branch -d hotfix/critical-fix
```

## ⚠️ Important Notes

1. **Never commit `.env` files** - They're gitignored
2. **Always commit `.env.example` files** - Templates are version controlled
3. **Use `ENV_MODE` toggle** - Single point to switch environments
4. **Tag all releases** - Essential for rollback capability
5. **Sync before running** - `npm run dev` auto-syncs, but manual sync available

## 📚 Files Created

- `config/env.js` - Environment loader
- `config/environments/development.js` - Development config structure
- `config/environments/production.js` - Production config structure
- `scripts/sync-env.js` - Environment sync script
- `.gitignore` - Updated to exclude .env files
- `package.json` - Added environment management scripts

## 🎯 Status

✅ Git Flow branches created (master, develop)  
✅ Configuration structure created  
✅ Environment sync script created  
✅ .gitignore updated  
⏳ `.env.example` files need to be created manually (security restriction)  
⏳ Root `.env` file needs to be created manually  

Next: Create `.env.example` templates and root `.env` file, then run `npm run env:sync` to sync your development configuration.
