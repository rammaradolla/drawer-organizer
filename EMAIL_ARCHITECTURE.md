# Email Architecture for E-Commerce Application

## Overview

This document outlines the email architecture for the Design2Organize e-commerce application, ensuring all customer-facing emails are sent from `support@design2organize.net` with proper branding and professional formatting.

## Email Configuration

### Primary Email Address
- **From Address**: `support@design2organize.net`
- **Display Name**: `Design2Organize Support` (or `Design2Organize`)
- **Purpose**: All customer-facing emails (order confirmations, status updates, etc.)

### Environment Variables
```env
EMAIL_USER=support@design2organize.net
EMAIL_PASS=your_email_password
EMAIL_HOST=mail.design2organize.net
EMAIL_PORT=465
EMAIL_SECURE=true
```

## Email Flow Architecture

### 1. Order Confirmation Email

**Trigger**: When payment is successfully processed via Stripe webhook

**Flow**:
```
Customer completes payment
    ↓
Stripe sends webhook: checkout.session.completed
    ↓
Server updates order status to "in_progress"
    ↓
emailService.sendOrderConfirmation(orderId) called
    ↓
Email sent from: support@design2organize.net
Email sent to: customer.email
```

**Email Content**:
- Order details (ID, items, total)
- Billing and shipping addresses
- Order status
- Next steps
- Support contact information

**Implementation**: `server/services/emailService.js` → `sendOrderConfirmation()`

### 2. Order Status Update Emails

**Trigger**: When order status changes (via admin/operations dashboard)

**Flow**:
```
Admin/Operations updates order status
    ↓
emailService.sendOrderStatusUpdate() called
    ↓
Email sent from: support@design2organize.net
Email sent to: customer.email
```

**Email Content**:
- Previous status → New status
- Order details
- Tracking information (if available)
- Support contact

**Implementation**: `server/services/emailService.js` → `sendOrderStatusUpdate()`

### 3. Tracking Update Emails

**Trigger**: When tracking information is added to an order

**Flow**:
```
Operations adds tracking number
    ↓
emailService.sendTrackingUpdate() called
    ↓
Email sent from: support@design2organize.net
Email sent to: customer.email
```

**Email Content**:
- Tracking number
- Carrier information
- Expected delivery date
- Support contact

**Implementation**: `server/services/emailService.js` → `sendTrackingUpdate()`

## Email Service Architecture

### Core Components

1. **Email Transporter** (`server/services/emailService.js`)
   - Configured via environment variables
   - Supports SMTP (cPanel email) and service-based (Gmail) configurations
   - Handles authentication and connection

2. **Email Templates** (`emailTemplates` object)
   - HTML templates for all email types
   - Consistent branding and styling
   - Responsive design for mobile devices

3. **Email Service Functions**
   - `sendOrderConfirmation(orderId)` - Order confirmation
   - `sendOrderStatusUpdate()` - Status changes
   - `sendTrackingUpdate()` - Tracking information
   - `sendOrderCancelled()` - Cancellation notices
   - `sendOrderBlocked()` - Order issues

### Email Format Standards

**From Field Format**:
```javascript
from: `"Design2Organize Support" <${process.env.EMAIL_USER}>`
// Results in: "Design2Organize Support" <support@design2organize.net>
```

**Reply-To** (if needed):
```javascript
replyTo: process.env.EMAIL_USER // support@design2organize.net
```

**Email Headers**:
- Subject: Clear, descriptive (e.g., "Order #12345678 Confirmation")
- Content-Type: `text/html`
- Character Encoding: UTF-8

## Integration Points

### Stripe Webhook Integration

**Location**: `server/services/stripeService.js`

**Event**: `checkout.session.completed`

**Code Flow**:
```javascript
// When payment is confirmed
const emailSent = await emailService.sendOrderConfirmation(order.id);
```

**Error Handling**:
- Email failures don't break order processing
- Errors are logged but webhook processing continues
- Allows manual email resend if needed

### Order Management Integration

**Location**: `server/routes/fulfillment.js`

**Triggers**:
- Status updates → `sendOrderStatusUpdate()`
- Tracking added → `sendTrackingUpdate()`
- Order cancelled → `sendOrderCancelled()`

## Email Template Design

### Branding Elements

1. **Header**:
   - Logo (if available)
   - Company name: "Design2Organize"
   - Tagline: "Custom Drawer Inserts to Organize"

2. **Color Scheme**:
   - Primary: Teal (#14b8a6) - matches website
   - Secondary: Blue (#007bff)
   - Text: Dark gray (#333)
   - Background: Light gray (#f8f9fa)

3. **Footer**:
   - Support email: `support@design2organize.net`
   - Company information
   - Unsubscribe option (if needed)

### Template Structure

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <!-- Header -->
  <div style="background: #14b8a6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">Design2Organize</h1>
  </div>
  
  <!-- Content -->
  <div style="padding: 30px 20px;">
    <!-- Dynamic content based on email type -->
  </div>
  
  <!-- Footer -->
  <div style="background: #f8f9fa; padding: 20px; text-align: center;">
    <p>Questions? Contact us at support@design2organize.net</p>
  </div>
</div>
```

## Error Handling & Logging

### Logging Strategy

All email operations are logged with:
- Timestamp
- Email type
- Recipient email
- Order ID (if applicable)
- Success/failure status
- Error details (if failed)

**Example Log Output**:
```
[Order Confirmation Email] Starting email send for order abc123
[Order Confirmation Email] Found user customer@example.com for order abc123
[Order Confirmation Email] Attempting to send email to customer@example.com
[Order Confirmation Email] Successfully sent confirmation email
```

### Error Handling

1. **Email Service Not Configured**:
   - Logs error
   - Returns `false`
   - Doesn't break order processing

2. **Invalid Email Address**:
   - Validates email format
   - Logs error if invalid
   - Returns `false`

3. **SMTP Connection Errors**:
   - Catches and logs error
   - Returns `false`
   - Allows retry mechanism

4. **Template Generation Errors**:
   - Logs error
   - Returns `false`
   - Prevents sending malformed emails

## Security Considerations

### Email Authentication

1. **SPF Records**: Configure SPF for `design2organize.net`
2. **DKIM**: Set up DKIM signing (if supported by email provider)
3. **DMARC**: Configure DMARC policy

### Data Privacy

1. **No Sensitive Data**: Don't include full credit card numbers
2. **PII Handling**: Only include necessary customer information
3. **GDPR Compliance**: Include unsubscribe options if required

## Testing Strategy

### Test Scenarios

1. **Order Confirmation**:
   - Complete test payment
   - Verify email received
   - Check email content accuracy
   - Verify "from" address

2. **Status Updates**:
   - Manually update order status
   - Verify email sent
   - Check status change reflected

3. **Error Handling**:
   - Test with invalid email
   - Test with email service down
   - Verify graceful degradation

### Test Email Endpoint

**Location**: `server/routes/stripe.js` → `POST /api/stripe/test-order-email/:orderId`

**Usage**:
```bash
curl -X POST http://localhost:3000/api/stripe/test-order-email/ORDER_ID
```

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Email Delivery Rate**: % of emails successfully sent
2. **Email Open Rate**: % of emails opened (if tracking enabled)
3. **Error Rate**: % of email send failures
4. **Response Time**: Time to send email after trigger

### Maintenance Tasks

1. **Regular Checks**:
   - Verify email credentials still valid
   - Check email service logs
   - Monitor bounce rates

2. **Template Updates**:
   - Keep branding consistent
   - Update content as needed
   - Test after changes

3. **Configuration Updates**:
   - Update email address if needed
   - Adjust SMTP settings if provider changes
   - Update environment variables

## Best Practices

1. **Always use `support@design2organize.net`** for customer-facing emails
2. **Include clear subject lines** with order numbers
3. **Provide support contact** in every email
4. **Use HTML templates** for professional appearance
5. **Test emails** before production deployment
6. **Log all email operations** for debugging
7. **Handle errors gracefully** - don't break order processing
8. **Keep templates updated** with current branding

## Future Enhancements

1. **Email Queue System**: For high-volume sending
2. **Email Templates Management**: Admin interface for templates
3. **Email Analytics**: Track opens, clicks, bounces
4. **A/B Testing**: Test different email formats
5. **Automated Follow-ups**: Reminder emails for abandoned carts
6. **Multi-language Support**: Localized email templates

---

**Last Updated**: 2026-01-12  
**Maintained By**: Development Team  
**Contact**: support@design2organize.net
