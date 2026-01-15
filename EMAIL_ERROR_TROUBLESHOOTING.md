# Email Error Troubleshooting Guide

## Current Errors Observed

### 1. `TypeError: fetch failed` (Supabase Connection Issue)

**Error Details:**
- `TypeError: fetch failed` at `node:internal/deps/undici/undici:15363:13`
- Occurring when trying to fetch order data from Supabase
- Order ID: `ca2aef62-4af8-4cc4-8c96-eb359f92b9da`

**What This Means:**
- The email service is trying to fetch order data from Supabase
- The Supabase client (which uses `fetch` internally) cannot connect to Supabase
- This prevents the email from being sent because it can't get the order/user data

**Possible Causes:**
1. **Missing Supabase credentials** in `server/.env`:
   - `SUPABASE_URL` not set or incorrect
   - `SUPABASE_SERVICE_ROLE_KEY` not set or incorrect

2. **Network connectivity issue:**
   - Internet connection is down or unstable
   - Firewall blocking connections to Supabase
   - Supabase service is temporarily down

3. **Incorrect Supabase configuration:**
   - Wrong Supabase URL
   - Wrong service role key

**Solution Steps:**

1. **Check `.env` file:**
   ```bash
   # Make sure these are set in server/.env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

2. **Verify Supabase connection:**
   - Test if other API endpoints that use Supabase are working
   - Check Supabase dashboard to ensure service is up

3. **Check network connectivity:**
   - Ensure server has internet access
   - Check if firewall is blocking outbound connections

### 2. `ECONNRESET` (SMTP Connection Reset)

**Error Details:**
- `Error: read ECONNRESET`
- Error code: `ESOCKET`
- Command: `CONN`
- Occurring during SMTP connection attempt
- Order ID: `8986230e-0698-4945-8096-3b78144aa366`

**What This Means:**
- The SMTP connection to GoDaddy's email server is being reset
- The connection is established but then immediately closed/reset
- Different from quota error (which would show `550` response code)

**Possible Causes:**
1. **GoDaddy SMTP server issues:**
   - Server is overloaded
   - Server is rejecting connections
   - Temporary service outage

2. **Network connectivity issue:**
   - Unstable network connection
   - Firewall blocking/resetting SMTP connections
   - Timeout issues

3. **SMTP configuration issues:**
   - Wrong port (587 vs 465)
   - Wrong security settings
   - Connection timeout too short

4. **Rate limiting/abuse detection:**
   - Too many connection attempts
   - GoDaddy detecting unusual activity
   - IP address blocked

**Solution Steps:**

1. **Wait and retry:**
   - `ECONNRESET` can be temporary
   - Wait a few minutes and try again
   - Check if other email attempts work

2. **Check SMTP settings in `.env`:**
   ```bash
   EMAIL_HOST=smtpout.secureserver.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=support@design2organize.net
   EMAIL_PASS=your-password
   ```

3. **Try alternative port:**
   - If using port 587, try port 465 with `EMAIL_SECURE=true`
   - If using port 465, try port 587 with `EMAIL_SECURE=false`

4. **Check GoDaddy email service status:**
   - Log into GoDaddy dashboard
   - Check if email service is operational
   - Check for any alerts or issues

5. **Verify not blocked:**
   - Check if your IP address is blocked
   - Contact GoDaddy support if needed

## Comparison: Quota vs Connection Reset

| Error Type | Error Code | Response Code | Meaning |
|------------|-----------|---------------|---------|
| **Quota Exceeded** | `EMESSAGE` | `550` | Authentication works, but sending limit reached |
| **Connection Reset** | `ESOCKET` | `undefined` | Connection established but reset immediately |
| **Fetch Failed** | `TypeError: fetch failed` | N/A | Cannot connect to Supabase API |

## Recommended Actions

### Immediate Steps:

1. **Fix Supabase connection issue first:**
   - Check `server/.env` for Supabase credentials
   - Verify Supabase URL and service role key
   - Test Supabase connection with a simple query

2. **For SMTP connection reset:**
   - Wait a few minutes and retry
   - Check GoDaddy email service status
   - Try alternative SMTP port if issue persists

3. **Check server logs:**
   - Look for Supabase connection errors
   - Look for SMTP connection errors
   - Verify environment variables are loaded

### Debugging Steps:

1. **Test Supabase connection:**
   ```javascript
   // In server console or test script
   const { createClient } = require('@supabase/supabase-js');
   const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
   
   // Test query
   const { data, error } = await supabase.from('orders').select('id').limit(1);
   console.log('Supabase connection:', error ? 'FAILED' : 'SUCCESS', error);
   ```

2. **Test SMTP connection:**
   ```bash
   node server/test-email-debug.js your-email@gmail.com
   ```

3. **Check environment variables:**
   ```bash
   # In server directory
   cat .env | grep -E "SUPABASE|EMAIL"
   ```

## Next Steps

1. **Verify Supabase credentials** are correct in `server/.env`
2. **Test Supabase connection** with a simple query
3. **Wait and retry** SMTP connection (could be temporary)
4. **Check GoDaddy email service status** if connection reset persists
5. **Consider using email service provider** (SendGrid, Mailgun) for production if GoDaddy SMTP continues to have issues
