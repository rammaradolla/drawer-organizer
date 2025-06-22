# Audit Log System Documentation

## Overview
The audit log system tracks all changes made to orders in the drawer organizer application. This provides a complete history of order modifications for compliance, debugging, and operational transparency.

## Types of Audit Log Entries

### 1. **ORDER_CREATED**
- **When**: When a customer creates a new order through the checkout process
- **Action**: `ORDER_CREATED`
- **Data Captured**:
  - Initial status: `pending`
  - Total price
  - Number of cart items
  - Order creation timestamp
- **Example**: "Order created with 2 items, total: $45.00"

### 2. **PAYMENT_RECEIVED**
- **When**: When Stripe webhook confirms payment completion
- **Action**: `PAYMENT_RECEIVED`
- **Data Captured**:
  - Status change: `pending` → `paid`
  - Payment confirmation timestamp
- **Example**: "Payment completed via Stripe. Order status changed from pending to paid."

### 3. **STATUS_CHANGED**
- **When**: When operations team changes order status in fulfillment dashboard
- **Action**: `STATUS_CHANGED`
- **Data Captured**:
  - Old status value
  - New status value
  - User who made the change
  - Timestamp of change
- **Example**: "Status changed from pending to in_progress by operations@company.com"

### 4. **TRACKING_UPDATED**
- **When**: When tracking information is added or modified
- **Action**: `TRACKING_UPDATED`
- **Data Captured**:
  - Old tracking number (if any)
  - New tracking number
  - User who updated tracking
- **Example**: "Tracking number updated by operations@company.com"

### 5. **ORDER_UPDATED**
- **When**: When other order fields are modified (notes, blocker_reason, etc.)
- **Action**: `ORDER_UPDATED`
- **Data Captured**:
  - Modified fields and their values
  - User who made the changes
- **Example**: "Order fields updated by operations@company.com"

### 6. **BULK_UPDATE**
- **When**: When multiple orders are updated simultaneously
- **Action**: `bulk_update`
- **Data Captured**:
  - All updated fields
  - Number of orders affected
  - User who performed bulk update
- **Example**: "Bulk update by operations@company.com"

## Database Schema

### Order Audit Log Table
```sql
CREATE TABLE order_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  updated_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Issues Fixed

### 1. **Missing Action Field**
**Problem**: Audit log entries were being created without an `action` field, which is required by the database schema.

**Fix**: Added default `action: 'ORDER_UPDATED'` and specific actions for different types of changes.

### 2. **JSON Serialization Issues**
**Problem**: `old_values` and `new_values` were being stored as plain objects instead of JSON strings.

**Fix**: Added `JSON.stringify()` to properly serialize the values before database insertion.

### 3. **Frontend Display Issues**
**Problem**: The audit view was displaying raw JSON strings instead of formatted data.

**Fix**: Updated the frontend to properly parse and display JSON values with proper formatting.

### 4. **Missing Order Creation Audit**
**Problem**: No audit entries were created when orders were first created.

**Fix**: Added audit logging in the Stripe service for order creation and payment confirmation.

## How to View Audit Logs

1. **Access Fulfillment Dashboard**: Navigate to the fulfillment dashboard (requires operations role)
2. **Find Order**: Locate the specific order in the orders table
3. **Click Audit Button**: Click the "Audit" button in the Actions column
4. **View Audit Modal**: The audit log modal will display all entries for that order

## Audit Log Entry Format

Each audit log entry displays:
- **Timestamp**: When the change occurred
- **User**: Who made the change (email address)
- **Action**: Type of change made
- **Notes**: Human-readable description of the change
- **New Values**: JSON representation of the updated data

## Status Values Tracked

The system tracks these order statuses:
- `pending`: Order received, not yet processed
- `paid`: Payment received, ready for processing
- `in_progress`: Order is being manufactured/processed
- `fulfilled`: Order completed and shipped
- `blocked`: Order blocked due to issues
- `cancelled`: Order cancelled

## Security and Access

- **Customer Access**: Customers can only see their own orders, not audit logs
- **Operations Access**: Operations team can view and modify orders and see audit logs
- **Admin Access**: Full access to all orders and audit logs

## Troubleshooting

### No Audit Entries Showing
1. Check if the order exists in the database
2. Verify the user has proper permissions
3. Check server logs for any database errors
4. Ensure the audit log table exists and has proper structure

### Missing Recent Changes
1. Check if the server is running properly
2. Verify the API endpoints are responding
3. Check browser console for any JavaScript errors
4. Ensure the user session is valid

## Future Enhancements

1. **Export Functionality**: Add ability to export audit logs to CSV/PDF
2. **Advanced Filtering**: Filter audit logs by date range, user, or action type
3. **Email Notifications**: Send notifications for critical status changes
4. **Audit Log Retention**: Implement automatic cleanup of old audit entries
5. **Real-time Updates**: Add WebSocket support for real-time audit log updates 