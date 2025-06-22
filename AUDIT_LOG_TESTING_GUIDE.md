# Audit Log Testing Guide

## Overview
This guide will help you test and verify all 5 types of audit log entries in your drawer organizer application. Follow these steps to see each type of entry in action.

## Prerequisites
1. Make sure your application is running (`npm start`)
2. Have access to both customer and operations user accounts
3. Ensure your database has the `order_audit_log` table created

## Testing Each Audit Log Type

### 1. **ORDER_CREATED** - Customer Creates New Order

#### Steps:
1. **Open the application** in your browser
2. **Sign in as a customer** (or create a new customer account)
3. **Design a drawer organizer**:
   - Go to the main page
   - Set dimensions (e.g., 30" × 20" × 6")
   - Add compartments
   - Choose wood type
4. **Add to cart** and **proceed to checkout**
5. **Complete the order** (you can use Stripe test mode)

#### Expected Result:
- Order will be created with status `pending`
- **ORDER_CREATED** entry will appear in audit log
- Entry will show: "Order created with X items, total: $XX.XX"

#### How to Verify:
1. Sign in as operations user
2. Go to Fulfillment Dashboard
3. Find the new order
4. Click "Audit" button
5. You should see the **ORDER_CREATED** entry

---

### 2. **PAYMENT_RECEIVED** - Stripe Payment Confirmation

#### Steps:
1. **Complete a test payment** using Stripe test mode
2. **Use test card**: 4242 4242 4242 4242
3. **Complete the checkout process**

#### Expected Result:
- Order status will change from `pending` to `paid`
- **PAYMENT_RECEIVED** entry will appear in audit log
- Entry will show: "Payment completed via Stripe. Order status changed from pending to paid."

#### How to Verify:
1. Check the audit log for the same order
2. You should now see both **ORDER_CREATED** and **PAYMENT_RECEIVED** entries

---

### 3. **STATUS_CHANGED** - Operations Team Updates Status

#### Steps:
1. **Sign in as operations user**
2. **Go to Fulfillment Dashboard**
3. **Find an order** (preferably one with status `pending` or `paid`)
4. **Change the status** using the dropdown:
   - From `pending` to `in_progress`
   - From `in_progress` to `fulfilled`
   - From `fulfilled` to `blocked`
   - etc.

#### Expected Result:
- **STATUS_CHANGED** entry will appear in audit log
- Entry will show: "Status changed from [old_status] to [new_status] by [user_email]"
- Old and new values will be clearly displayed

#### Test Multiple Status Changes:
1. Change status from `pending` → `in_progress`
2. Change status from `in_progress` → `fulfilled`
3. Change status from `fulfilled` → `blocked`
4. Each change should create a separate audit entry

---

### 4. **TRACKING_UPDATED** - Add/Modify Tracking Information

#### Steps:
1. **Sign in as operations user**
2. **Go to Fulfillment Dashboard**
3. **Find an order** (preferably one with status `in_progress` or `fulfilled`)
4. **Add tracking information**:
   - Enter a tracking number (e.g., "1Z999AA1234567890")
   - The system will automatically detect this as a tracking update

#### Expected Result:
- **TRACKING_UPDATED** entry will appear in audit log
- Entry will show: "Tracking number updated by [user_email]"
- Old tracking number (if any) and new tracking number will be displayed

#### Test Tracking Modifications:
1. Add initial tracking number
2. Modify the tracking number to a different value
3. Each change should create a separate audit entry

---

### 5. **ORDER_UPDATED** - Modify Other Order Fields

#### Steps:
1. **Sign in as operations user**
2. **Go to Fulfillment Dashboard**
3. **Find an order**
4. **Modify other fields** (you may need to add these fields to the UI):
   - Add notes: "Order is being processed"
   - Add blocker reason: "Waiting for wood material"
   - Update carrier information

#### Expected Result:
- **ORDER_UPDATED** entry will appear in audit log
- Entry will show: "Order fields updated by [user_email]"
- Modified fields and their values will be displayed

---

## Complete Testing Scenario

### Full Order Lifecycle Test:

1. **Customer creates order** → **ORDER_CREATED**
2. **Customer completes payment** → **PAYMENT_RECEIVED**
3. **Operations changes status to "in_progress"** → **STATUS_CHANGED**
4. **Operations adds tracking number** → **TRACKING_UPDATED**
5. **Operations adds notes** → **ORDER_UPDATED**
6. **Operations changes status to "fulfilled"** → **STATUS_CHANGED**

### Expected Audit Log Sequence:
```
1. ORDER_CREATED - Order created with 2 items, total: $45.00
2. PAYMENT_RECEIVED - Payment completed via Stripe. Order status changed from pending to paid.
3. STATUS_CHANGED - Status changed from paid to in_progress by operations@company.com
4. TRACKING_UPDATED - Tracking number updated by operations@company.com
5. ORDER_UPDATED - Order fields updated by operations@company.com
6. STATUS_CHANGED - Status changed from in_progress to fulfilled by operations@company.com
```

## Troubleshooting

### If You Don't See Audit Entries:

1. **Check Database Connection**:
   ```bash
   # Verify your Supabase connection
   # Check environment variables
   ```

2. **Check Server Logs**:
   ```bash
   # Look for any errors in the server console
   # Check for database connection issues
   ```

3. **Verify Database Schema**:
   ```sql
   -- Make sure the order_audit_log table exists
   SELECT * FROM order_audit_log LIMIT 1;
   ```

4. **Check User Permissions**:
   - Ensure operations user has proper role
   - Verify authentication is working

### Common Issues:

1. **"No audit log entries" message**:
   - Check if the order exists
   - Verify the audit log table has data
   - Check user permissions

2. **Missing recent changes**:
   - Refresh the page
   - Check server is running
   - Verify API endpoints are responding

3. **JSON parsing errors**:
   - Check browser console for errors
   - Verify the data format in database

## Verification Checklist

- [ ] **ORDER_CREATED** entries appear when customers place orders
- [ ] **PAYMENT_RECEIVED** entries appear when payments are completed
- [ ] **STATUS_CHANGED** entries appear when status is modified
- [ ] **TRACKING_UPDATED** entries appear when tracking is added/modified
- [ ] **ORDER_UPDATED** entries appear when other fields are changed
- [ ] All entries show proper timestamps
- [ ] All entries show the correct user who made the change
- [ ] JSON values are properly formatted in the display
- [ ] Audit log entries are in chronological order (newest first)

## Next Steps

Once you've verified all audit log types are working:

1. **Test edge cases** (cancelled orders, bulk updates, etc.)
2. **Verify data integrity** (check that old/new values are correct)
3. **Test with multiple users** (different operations team members)
4. **Export functionality** (if implemented)
5. **Performance testing** (with many orders and audit entries)

## Support

If you encounter issues:
1. Check the server logs for error messages
2. Verify your database schema matches the requirements
3. Ensure all environment variables are properly set
4. Check that Supabase is accessible and responding 