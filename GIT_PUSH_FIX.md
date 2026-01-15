# Git Push HTTP 400 Error - Troubleshooting Guide

## Problem
Getting `HTTP 400` error when pushing to GitHub:
```
error: RPC failed; HTTP 400 curl 22 The requested URL returned error: 400
send-pack: unexpected disconnect while reading sideband packet
fatal: the remote end hung up unexpectedly
```

## Common Causes & Solutions

### Solution 1: Increase HTTP Post Buffer (Most Common Fix)

Git might be trying to push too much data at once. Increase the buffer:

```bash
# Increase HTTP post buffer to 500MB
git config http.postBuffer 524288000

# Try pushing again
git push origin main
```

### Solution 2: Check Authentication Token

The Personal Access Token (PAT) might have expired or have incorrect scopes:

1. **Check if token is valid:**
   - Go to: https://github.com/settings/tokens
   - Verify your token exists and hasn't expired

2. **Verify token scopes:**
   - The token needs `repo` scope for private repos
   - For public repos, check GitHub's requirements

3. **Update credentials:**
   ```bash
   # Clear cached credentials
   git credential-osxkeychain erase
   host=github.com
   protocol=https
   # Press Enter twice
   
   # Try pushing again - it will prompt for credentials
   git push origin main
   ```

### Solution 3: Try SSH Instead of HTTPS

SSH is often more reliable for large pushes:

1. **Check if you have SSH keys:**
   ```bash
   ls -la ~/.ssh/id_rsa.pub
   ```

2. **If no SSH key, generate one:**
   ```bash
   ssh-keygen -t ed25519 -C "your_email@example.com"
   # Copy the public key
   cat ~/.ssh/id_rsa.pub
   ```

3. **Add SSH key to GitHub:**
   - Go to: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key

4. **Change remote URL to SSH:**
   ```bash
   git remote set-url origin git@github.com:rammaradolla/drawer-organizer.git
   git push origin main
   ```

### Solution 4: Push in Smaller Chunks

If the push is very large, try pushing commits individually:

```bash
# See what commits need to be pushed
git log origin/main..HEAD

# Push specific commit (if needed)
# This is more advanced - usually not needed
```

### Solution 5: Verify Repository Access

Make sure you have write access to the repository:

1. Visit: https://github.com/rammaradolla/drawer-organizer
2. Verify you can see the repository
3. Check if you're a collaborator or owner

### Solution 6: Check Network/Proxy Settings

If you're behind a corporate firewall or proxy:

```bash
# Configure Git to use proxy (if needed)
git config --global http.proxy http://proxy.example.com:8080
git config --global https.proxy http://proxy.example.com:8080

# Or disable proxy if not needed
git config --global --unset http.proxy
git config --global --unset https.proxy
```

### Solution 7: Update Git Credential Helper

Sometimes the credential helper gets stuck:

```bash
# Reset credential helper
git config --global credential.helper osxkeychain

# Clear stored credentials
git credential-osxkeychain erase <<EOF
host=github.com
protocol=https
EOF

# Try pushing again
git push origin main
```

## Quick Diagnostic Steps

1. **Test connection:**
   ```bash
   git ls-remote origin
   ```
   If this fails, it's an authentication/network issue.

2. **Check remote URL:**
   ```bash
   git remote -v
   ```
   Should show: `https://rammaradolla@github.com/rammaradolla/drawer-organizer.git`

3. **Check branch status:**
   ```bash
   git status
   ```
   Verify you're on `main` and ahead of `origin/main`

## Recommended Order of Actions

1. **First:** Increase HTTP post buffer (Solution 1)
2. **If that fails:** Clear credentials and re-authenticate (Solution 2)
3. **If still failing:** Switch to SSH (Solution 3)
4. **Last resort:** Contact GitHub support if it's a repository access issue

## If All Else Fails

1. **Check GitHub Status:** https://www.githubstatus.com/
2. **Try pushing from terminal instead of SourceTree**
3. **Contact GitHub Support** if the issue persists

## Notes

- Your logo files (2MB each) are well within GitHub's limits
- The commit size is reasonable (15 files changed)
- This is likely a Git configuration or authentication issue
