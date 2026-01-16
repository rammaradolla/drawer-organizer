const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Load logo as base64 for email embedding (more reliable than external URLs)
let logoBase64 = null;
try {
  // Try multiple paths to ensure we find the logo file
  const possiblePaths = [
    path.join(__dirname, '../client/public/images/design2organize-logo4.png'),
    path.join(process.cwd(), 'client/public/images/design2organize-logo4.png'),
    path.resolve(__dirname, '../../client/public/images/design2organize-logo4.png')
  ];
  
  let logoPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath)) {
      logoPath = testPath;
      console.log('[Email Service] ✅ Found logo at:', logoPath);
      break;
    }
  }
  
  if (logoPath) {
    try {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = logoBuffer.toString('base64');
      const sizeKB = (logoBuffer.length / 1024).toFixed(2);
      const base64Length = logoBase64.length;
      console.log(`[Email Service] ✅ Logo loaded successfully for email embedding`);
      console.log(`[Email Service]    - Path: ${logoPath}`);
      console.log(`[Email Service]    - Size: ${sizeKB} KB`);
      console.log(`[Email Service]    - Base64 length: ${base64Length} characters`);
    } catch (readError) {
      console.error('[Email Service] ❌ Error reading logo file:', readError.message);
    }
  } else {
    console.warn('[Email Service] ⚠️ Logo file not found. Tried paths:');
    possiblePaths.forEach(p => console.warn(`  - ${p}`));
  }
} catch (error) {
  console.error('[Email Service] ❌ Could not load logo:', error.message);
  console.error('[Email Service] Error stack:', error.stack);
}

// Track which orders have already had confirmation emails sent (prevents duplicates)
// This is an in-memory cache that persists for the server session
const confirmationEmailsSent = new Set();

// Track orders currently being processed (prevents concurrent processing of same order)
// Maps orderId -> Promise that resolves when email sending completes
const ordersInProgress = new Map();

// Configure email transporter
// Support both service-based (Gmail) and SMTP-based (cPanel/GoDaddy) configurations
let transporterConfig;
if (process.env.EMAIL_HOST) {
  // SMTP configuration (for cPanel email, GoDaddy, custom SMTP)
  const port = parseInt(process.env.EMAIL_PORT || '465');
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465;
  
  transporterConfig = {
    host: process.env.EMAIL_HOST,
    port: port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Connection pooling to limit concurrent connections
    pool: true,
    maxConnections: 1, // Limit to 1 concurrent connection to avoid "432 Concurrent connections limit exceeded"
    maxMessages: 1, // Send 1 message per connection
    rateDelta: 1000, // Wait 1 second between messages
    rateLimit: 1, // Max 1 message per rateDelta
    // GoDaddy-specific: Sometimes requires tls options
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates if needed
    },
    // Debug: Log authentication attempts
    debug: process.env.NODE_ENV === 'development',
    logger: process.env.NODE_ENV === 'development'
  };
  
  console.log('[Email Service] SMTP Configuration:', {
    host: transporterConfig.host,
    port: transporterConfig.port,
    secure: transporterConfig.secure,
    user: transporterConfig.auth.user,
    passSet: !!transporterConfig.auth.pass
  });
} else {
  // Service-based configuration (Gmail, Outlook, etc.)
  transporterConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
    },
    // Connection pooling to limit concurrent connections
    pool: true,
    maxConnections: 1, // Limit to 1 concurrent connection to avoid "432 Concurrent connections limit exceeded"
    maxMessages: 1, // Send 1 message per connection
    rateDelta: 1000, // Wait 1 second between messages
    rateLimit: 1 // Max 1 message per rateDelta
  };
}

const transporter = nodemailer.createTransport(transporterConfig);

// Helper function to get properly formatted "from" address
const getFromAddress = () => {
  const emailAddress = process.env.EMAIL_USER || 'support@design2organize.net';
  const displayName = process.env.EMAIL_DISPLAY_NAME || 'Design2Organize Support';
  return `"${displayName}" <${emailAddress}>`;
};

// Email templates
const emailTemplates = {
  orderStatusUpdate: (order, user, oldStatus, newStatus) => ({
    subject: `Order #${order.id.slice(0, 8)} Status Updated - ${newStatus.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #007bff;">
          <h1 style="color: #333; margin: 0;">Design 2 Organize</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Order Status Update</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || user.email},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your order status has been updated from <strong>${oldStatus}</strong> to <strong>${newStatus}</strong>.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin-top: 0;">Order Details</h3>
            <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
            <p><strong>Total Amount:</strong> $${order.total_price.toFixed(2)}</p>
            <p><strong>Status:</strong> <span style="color: #007bff; font-weight: bold;">${newStatus.toUpperCase()}</span></p>
            ${order.tracking_number ? `<p><strong>Tracking Number:</strong> ${order.tracking_number}</p>` : ''}
            ${order.tracking_carrier ? `<p><strong>Carrier:</strong> ${order.tracking_carrier.toUpperCase()}</p>` : ''}
            ${order.notes ? `<p><strong>Notes:</strong> ${order.notes}</p>` : ''}
          </div>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/orders" 
               style="background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Orders
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us at ${process.env.EMAIL_USER}
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Design 2 Organize. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  trackingUpdate: (order, user) => ({
    subject: `Tracking Information Added - Order #${order.id.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #28a745;">
          <h1 style="color: #333; margin: 0;">Design 2 Organize</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Your Order Has Been Shipped!</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || user.email},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Great news! Your order has been shipped and is on its way to you.
          </p>
          
          <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
            <h3 style="color: #333; margin-top: 0;">Shipping Information</h3>
            <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
            <p><strong>Carrier:</strong> ${order.tracking_carrier.toUpperCase()}</p>
            <p><strong>Tracking Number:</strong> <a href="https://www.google.com/search?q=${order.tracking_carrier}+tracking+${order.tracking_number}" target="_blank">${order.tracking_number}</a></p>
            <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">SHIPPED</span></p>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="https://www.google.com/search?q=${order.tracking_carrier}+tracking+${order.tracking_number}" 
               target="_blank"
               style="background: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Track Your Package
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            If you have any questions, please contact us at ${process.env.EMAIL_USER}
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Design 2 Organize. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  orderBlocked: (order, user, blockerReason) => ({
    subject: `Order #${order.id.slice(0, 8)} - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #dc3545;">
          <h1 style="color: #333; margin: 0;">Design 2 Organize</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Order Update Required</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || user.email},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            We've encountered an issue with your order that requires your attention.
          </p>
          
          <div style="background: #ffeaea; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
            <h3 style="color: #333; margin-top: 0;">Issue Details</h3>
            <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
            <p><strong>Status:</strong> <span style="color: #dc3545; font-weight: bold;">BLOCKED</span></p>
            <p><strong>Reason:</strong> ${blockerReason}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Please contact us as soon as possible so we can resolve this issue and continue processing your order.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="mailto:${process.env.EMAIL_USER}?subject=Order ${order.id.slice(0, 8)} - Issue Resolution" 
               style="background: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Contact Support
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            We apologize for any inconvenience and appreciate your patience.
          </p>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Design 2 Organize. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  orderCancelled: (order, user, reason, refund) => {
    const refundAmount = refund && refund.amount ? (refund.amount / 100).toFixed(2) : order.total_price ? Number(order.total_price).toFixed(2) : '0.00';
    const refundStatus = refund?.status || 'processing';
    const refundId = refund?.id || order.refund_id || 'Pending';
    const refundStatusText = refundStatus === 'succeeded' ? 'Succeeded' : refundStatus === 'pending' ? 'Processing' : 'Processing';
    
    return {
      subject: `Order #${order.id.slice(0, 8)} Cancelled`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #6c757d;">
            <h1 style="color: #333; margin: 0;">Design 2 Organize</h1>
            <p style="color: #666; margin: 10px 0 0 0;">Order Cancellation Notice</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || user.email},</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              Your order has been cancelled and a refund has been processed.
            </p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
              <h3 style="color: #333; margin-top: 0;">Cancellation Details</h3>
              <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
              <p><strong>Status:</strong> <span style="color: #6c757d; font-weight: bold;">CANCELLED</span></p>
              ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            </div>
            
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
              <h3 style="color: #333; margin-top: 0;">Refund Information</h3>
              <p><strong>Refund ID:</strong> ${refundId}</p>
              <p><strong>Refund Amount:</strong> <span style="color: #2e7d32; font-weight: bold; font-size: 18px;">$${refundAmount}</span></p>
              <p><strong>Status:</strong> <span style="color: ${refundStatus === 'succeeded' ? '#2e7d32' : '#f57c00'}; font-weight: bold;">${refundStatusText}</span></p>
              <p style="color: #555; font-size: 14px; margin-top: 15px; padding-top: 15px; border-top: 1px solid #c8e6c9;">
                Your refund will be credited back to your original payment method within 5-10 business days. You will receive a confirmation email once the refund is complete.
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              If you have any questions about the cancellation or refund process, please don't hesitate to contact us.
            </p>
            
            <div style="margin: 30px 0;">
              <a href="mailto:${process.env.EMAIL_USER || 'support@design2organize.net'}?subject=Order ${order.id.slice(0, 8)} - Cancellation Question" 
                 style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Contact Support
              </a>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
            <p>© 2024 Design 2 Organize. All rights reserved.</p>
          </div>
        </div>
      `
    };
  },

  operationsNotification: (order, user, action, updatedBy) => ({
    subject: `Operations Alert: ${action} - Order #${order.id.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #ffc107;">
          <h1 style="color: #333; margin: 0;">Operations Dashboard</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Order Update Notification</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Operations Team,</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            An order has been updated by ${updatedBy.email}.
          </p>
          
          <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <h3 style="color: #333; margin-top: 0;">Update Details</h3>
            <p><strong>Action:</strong> ${action}</p>
            <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
            <p><strong>Customer:</strong> ${user.email}</p>
            <p><strong>Status:</strong> ${order.status.toUpperCase()}</p>
            <p><strong>Updated By:</strong> ${updatedBy.email}</p>
            <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/fulfillment" 
               style="background: #ffc107; color: #333; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View in Dashboard
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Design 2 Organize. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  orderConfirmation: (order, user, cartItems) => {
    const orderDate = new Date(order.created_at).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Format addresses
    const formatAddress = (type) => {
      const prefix = type === 'billing' ? 'billing' : 'shipping';
      if (!order[`${prefix}_street`]) return 'Not provided';
      return `
        ${order[`${prefix}_street`]}<br>
        ${order[`${prefix}_city`]}, ${order[`${prefix}_state`]} ${order[`${prefix}_zip`]}<br>
        ${order[`${prefix}_country`] || 'US'}<br>
        ${order[`${prefix}_phone`] ? `Phone: ${order[`${prefix}_phone`]}` : ''}
      `;
    };

    // Generate items HTML
    const itemsHtml = (cartItems || []).map((item, index) => {
      const itemSubtotal = (item.price || 0) * (item.quantity || 1);
      
      // Build image HTML for both 2D and 3D images - VERTICALLY STACKED (one above the other)
      let imageHtml = '';
      if (item.image2D || item.image3D) {
        // Use block-level elements for reliable email client support
        imageHtml = '<div style="width: 180px; vertical-align: top;">';
        
        if (item.image2D) {
          imageHtml += `
            <div style="text-align: center; width: 100%; margin-bottom: 14px;">
              <div style="font-size: 11px; color: #666; margin-bottom: 7px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">2D View</div>
              <div style="width: 160px; height: 120px; margin: 0 auto; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; display: block;">
                <img src="${item.image2D}" 
                     alt="2D Design" 
                     style="max-width: 160px; max-height: 120px; width: auto; height: 120px; object-fit: contain; display: block; margin: 0 auto;">
              </div>
            </div>
          `;
        }
        
        if (item.image3D) {
          imageHtml += `
            <div style="text-align: center; width: 100%;">
              <div style="font-size: 11px; color: #666; margin-bottom: 7px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">3D View</div>
              <div style="width: 160px; height: 120px; margin: 0 auto; background: #fafafa; border: 1px solid #e0e0e0; border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); overflow: hidden; display: block;">
                <img src="${item.image3D}" 
                     alt="3D Design" 
                     style="max-width: 160px; max-height: 120px; width: auto; height: 120px; object-fit: contain; display: block; margin: 0 auto;">
              </div>
            </div>
          `;
        }
        
        imageHtml += '</div>';
      } else {
        imageHtml = '<div style="width: 160px; height: 120px; background: #f0f0f0; border-radius: 6px; display: block; text-align: center; line-height: 120px; color: #999; font-size: 11px;">No Image</div>';
      }
      
      return `
        <tr style="border-bottom: 1px solid #e0e0e0;">
          <td style="padding: 15px; vertical-align: top; width: 190px; text-align: center;">
            ${imageHtml}
          </td>
          <td style="padding: 15px; vertical-align: top;">
            <div style="font-weight: bold; color: #333; margin-bottom: 5px;">${item.wood_type || 'Custom'} Drawer Insert</div>
            <div style="color: #666; font-size: 14px; margin-bottom: 3px;">
              Dimensions: ${item.dimensions?.width || 'N/A'}&quot; × ${item.dimensions?.depth || 'N/A'}&quot; × ${item.dimensions?.height || 'N/A'}&quot;
            </div>
            <div style="color: #666; font-size: 14px;">Quantity: ${item.quantity || 1}</div>
          </td>
          <td style="padding: 15px; vertical-align: top; text-align: right;">
            <div style="font-weight: bold; color: #333;">$${(item.price || 0).toFixed(2)}</div>
            <div style="color: #666; font-size: 14px;">Subtotal: $${itemSubtotal.toFixed(2)}</div>
          </td>
        </tr>
      `;
    }).join('');

    // Generate logo URL or data URI
    // In development: Use base64 embedding (localhost URLs don't work in emails)
    // In production: Use domain URL
    let logoUrl = null;
    let logoDataUri = null;
    
    if (process.env.NODE_ENV === 'production') {
      // Production: Use domain URL (publicly accessible)
      const baseUrl = process.env.DOMAIN_URL || process.env.CLIENT_URL || 'http://design2organize.net';
      logoUrl = `${baseUrl}/images/design2organize-logo4.png`;
      console.log(`[Order Confirmation Email] Logo: Using production URL: ${logoUrl}`);
    } else {
      // Development: Use base64 embedding because localhost URLs are not accessible from email servers
      // Email clients like Gmail can't access http://localhost URLs
      if (logoBase64) {
        logoDataUri = `data:image/png;base64,${logoBase64}`;
        const logoSizeKB = (logoBase64.length * 3) / 4 / 1024;
        console.log(`[Order Confirmation Email] Logo: Using base64 embedding in development (${logoSizeKB.toFixed(2)} KB) - localhost URLs don't work in emails`);
      } else {
        // Fallback: Try to use external URL (won't work but better than nothing)
        const clientPort = process.env.VITE_PORT || '5173';
        logoUrl = `http://localhost:${clientPort}/images/design2organize-logo4.png`;
        console.warn(`[Order Confirmation Email] Logo: ⚠️ Using localhost URL (won't work in emails): ${logoUrl}`);
        console.warn(`[Order Confirmation Email] Logo: ⚠️ Logo not found for base64 embedding. Email clients can't access localhost URLs.`);
      }
    }
    
    return {
      subject: `Order Confirmation - Order #${order.id.slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff;">
          <!-- Header with Logo -->
          <div style="background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); padding: 40px 20px; text-align: center; color: white;">
            <!-- Logo Container -->
            <div style="margin-bottom: 20px;">
              ${logoDataUri ? `
                <!-- Base64 embedded logo (works in all email clients) -->
                <img src="${logoDataUri}" 
                     alt="Design 2 Organize" 
                     style="max-width: 250px; height: auto; display: block; margin: 0 auto; background: rgba(255,255,255,0.98); padding: 16px 20px; border-radius: 10px; box-shadow: 0 6px 12px rgba(0,0,0,0.2); width: auto; border: none; outline: none;">
              ` : logoUrl ? `
                <!-- External URL logo (production only) -->
                <img src="${logoUrl}" 
                     alt="Design 2 Organize" 
                     style="max-width: 250px; height: auto; display: block; margin: 0 auto; background: rgba(255,255,255,0.98); padding: 16px 20px; border-radius: 10px; box-shadow: 0 6px 12px rgba(0,0,0,0.2); width: auto; border: none; outline: none;"
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                <!-- Fallback text if image fails to load -->
                <h1 style="color: white; margin: 0; font-size: 28px; display: none; font-weight: 600; letter-spacing: 1px;">Design 2 Organize</h1>
              ` : `
                <!-- Text fallback if logo not available -->
                <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 600; letter-spacing: 1px;">Design 2 Organize</h1>
              `}
            </div>
            <!-- Order Confirmation Text -->
            <p style="color: rgba(255,255,255,0.95); margin: 10px 0 0 0; font-size: 18px; font-weight: 500; letter-spacing: 0.5px;">Order Confirmation</p>
            <!-- Order Number Badge -->
            <div style="margin-top: 20px; padding: 12px 20px; background: rgba(255,255,255,0.2); border-radius: 8px; display: inline-block; border: 1px solid rgba(255,255,255,0.3);">
              <span style="font-size: 14px; opacity: 0.95; font-weight: 500;">Order #</span>
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 1px;">${order.id.slice(0, 8).toUpperCase()}</span>
            </div>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 30px 20px;">
            <!-- Greeting -->
            <h2 style="color: #333; margin-bottom: 10px;">Thank you for your order, ${user.name || user.email}!</h2>
            <p style="color: #555; line-height: 1.6; margin-bottom: 25px;">
              We've received your order and payment has been confirmed. Your custom drawer insert is now being prepared for production.
            </p>
            
            <!-- Order Summary Box -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 15px;">Order Summary</h3>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Order Date:</span>
                <span style="color: #333; font-weight: bold;">${orderDate}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="color: #666;">Payment Status:</span>
                <span style="color: #28a745; font-weight: bold;">✓ Confirmed</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 15px; padding-top: 15px; border-top: 2px solid #ddd;">
                <span style="color: #333; font-size: 18px; font-weight: bold;">Order Total:</span>
                <span style="color: #333; font-size: 24px; font-weight: bold;">$${order.total_price?.toFixed(2) || '0.00'}</span>
              </div>
            </div>
            
            <!-- Items Section -->
            <h3 style="color: #333; margin-top: 30px; margin-bottom: 15px;">Ordered Items</h3>
            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px; background: white; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
              <thead>
                <tr style="background: #f8f9fa;">
                  <th style="padding: 12px; text-align: left; font-weight: bold; color: #333; width: 190px;">Preview</th>
                  <th style="padding: 12px; text-align: left; font-weight: bold; color: #333;">Item Details</th>
                  <th style="padding: 12px; text-align: right; font-weight: bold; color: #333;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || '<tr><td colspan="3" style="padding: 20px; text-align: center; color: #999;">No items found</td></tr>'}
              </tbody>
            </table>
            
            <!-- Addresses Section -->
            <table style="width: 100%; margin: 30px 0; border-collapse: collapse;">
              <tr>
                <td style="width: 50%; padding-right: 10px; vertical-align: top;">
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #007bff;">
                    <h3 style="color: #333; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Billing Address</h3>
                    <div style="color: #666; font-size: 14px; line-height: 1.8;">
                      ${formatAddress('billing')}
                    </div>
                  </div>
                </td>
                <td style="width: 50%; padding-left: 10px; vertical-align: top;">
                  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #28a745;">
                    <h3 style="color: #333; margin-top: 0; margin-bottom: 10px; font-size: 16px;">Shipping Address</h3>
                    <div style="color: #666; font-size: 14px; line-height: 1.8;">
                      ${formatAddress('shipping')}
                    </div>
                  </div>
                </td>
              </tr>
            </table>
            
            <!-- Next Steps -->
            <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 30px 0; border-left: 4px solid #28a745;">
              <h3 style="color: #333; margin-top: 0; margin-bottom: 10px;">What's Next?</h3>
              <p style="color: #555; line-height: 1.6; margin: 0;">
                Your order is now in production. You'll receive email updates as your order progresses through each stage. 
                Estimated processing time: 7-14 business days. We'll notify you once your order ships with tracking information.
              </p>
            </div>
            
            <!-- Action Buttons -->
            <div style="margin: 30px 0; text-align: center;">
              <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/orders" 
                 style="background: #007bff; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold; margin-right: 10px;">
                View Your Orders
              </a>
              <a href="mailto:${process.env.EMAIL_USER || 'support@design2organize.net'}?subject=Question about Order ${order.id.slice(0, 8)}" 
                 style="background: #6c757d; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Contact Support
              </a>
            </div>
            
            <!-- Support Info -->
            <p style="color: #666; font-size: 14px; margin-top: 30px; text-align: center;">
              If you have any questions about your order, please contact us at 
              <a href="mailto:${process.env.EMAIL_USER || 'support@design2organize.net'}" style="color: #007bff; text-decoration: none;">
                ${process.env.EMAIL_USER || 'support@design2organize.net'}
              </a>
            </p>
          </div>
          
          <!-- Footer -->
          <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #e0e0e0;">
            <p style="margin: 5px 0;">© ${new Date().getFullYear()} Design 2 Organize. All rights reserved.</p>
            <p style="margin: 5px 0;">This is an automated confirmation email. Please do not reply to this message.</p>
          </div>
        </div>
      `
    };
  }
};

// Email notification functions
const emailService = {
  // Send order status update notification to customer
  async sendOrderStatusUpdate(orderId, oldStatus, newStatus, updatedBy) {
    try {
      // Get order and user details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for email:', orderError);
        return false;
      }

      const user = order.users;
      if (!user) {
        console.error('No user found for order:', orderId);
        return false;
      }

      // Get template
      const template = emailTemplates.orderStatusUpdate(order, user, oldStatus, newStatus);

      // Send email from support@design2organize.net
      const mailOptions = {
        from: getFromAddress(),
        to: user.email,
        replyTo: process.env.EMAIL_USER || 'support@design2organize.net',
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order status update email sent from ${getFromAddress()} to ${user.email} for order ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error sending order status update email:', error);
      return false;
    }
  },

  // Send tracking information notification to customer
  async sendTrackingUpdate(orderId, updatedBy) {
    try {
      // Get order and user details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for tracking email:', orderError);
        return false;
      }

      const user = order.users;
      if (!user) {
        console.error('No user found for order:', orderId);
        return false;
      }

      // Get template
      const template = emailTemplates.trackingUpdate(order, user);

      // Send email from support@design2organize.net
      const mailOptions = {
        from: getFromAddress(),
        to: user.email,
        replyTo: process.env.EMAIL_USER || 'support@design2organize.net',
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Tracking update email sent from ${getFromAddress()} to ${user.email} for order ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error sending tracking update email:', error);
      return false;
    }
  },

  // Send order blocked notification to customer
  async sendOrderBlockedNotification(orderId, blockerReason, updatedBy) {
    try {
      // Get order and user details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for blocked email:', orderError);
        return false;
      }

      const user = order.users;
      if (!user) {
        console.error('No user found for order:', orderId);
        return false;
      }

      // Get template
      const template = emailTemplates.orderBlocked(order, user, blockerReason);

      // Send email from support@design2organize.net
      const mailOptions = {
        from: getFromAddress(),
        to: user.email,
        replyTo: process.env.EMAIL_USER || 'support@design2organize.net',
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order blocked email sent from ${getFromAddress()} to ${user.email} for order ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error sending order blocked email:', error);
      return false;
    }
  },

  // Send order cancelled notification to customer
  async sendOrderCancelledNotification(orderId, reason, updatedBy) {
    try {
      // Get order and user details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for cancelled email:', orderError);
        return false;
      }

      const user = order.users;
      if (!user) {
        console.error('No user found for order:', orderId);
        return false;
      }

      // Get cancellation reason from order or parameter
      const cancellationReason = reason || order.cancelled_reason || null;

      // Get refund from order (if passed as second parameter in updated calls)
      // For backward compatibility, check order.refund_id
      const refundData = order.refund_id ? { id: order.refund_id, status: 'succeeded', amount: order.total_price ? Math.round(Number(order.total_price) * 100) : null } : null;

      // Get template with refund details
      const template = emailTemplates.orderCancelled(order, user, cancellationReason, refundData);

      // Send email from support@design2organize.net
      const mailOptions = {
        from: getFromAddress(),
        to: user.email,
        replyTo: process.env.EMAIL_USER || 'support@design2organize.net',
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`[Order Cancellation Email] ✅ Successfully sent cancellation email to ${user.email} for order ${orderId}`);
      return true;
    } catch (error) {
      console.error(`[Order Cancellation Email] ❌ Error sending cancellation email for order ${orderId}:`, error);
      return false;
    }
  },

  // Send order cancellation email (new function with refund support)
  async sendOrderCancellation(orderId, refund) {
    console.log(`[Order Cancellation Email] ========================================`);
    console.log(`[Order Cancellation Email] FUNCTION CALLED for order ${orderId}`);
    console.log(`[Order Cancellation Email] ========================================`);

    try {
      // Fetch order and user data from database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error(`[Order Cancellation Email] Error fetching order ${orderId}:`, orderError);
        return false;
      }

      const user = order.users;
      if (!user || !user.email) {
        console.error(`[Order Cancellation Email] No user or email found for order ${orderId}`);
        return false;
      }

      console.log(`[Order Cancellation Email] Found user ${user.email} for order ${orderId}`);

      // Get cancellation reason from order
      const cancellationReason = order.cancelled_reason || null;

      // Use refund parameter if provided, otherwise check order
      const refundData = refund || (order.refund_id ? { id: order.refund_id, status: 'succeeded', amount: order.total_price ? Math.round(Number(order.total_price) * 100) : null } : null);

      // Get email template
      const template = emailTemplates.orderCancelled(order, user, cancellationReason, refundData);

      // Validate email address
      if (!user.email || !user.email.includes('@')) {
        console.error(`[Order Cancellation Email] Invalid email address for order ${orderId}: ${user.email}`);
        return false;
      }

      // Validate email service configuration
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error(`[Order Cancellation Email] Email service not configured. EMAIL_USER: ${!!process.env.EMAIL_USER}, EMAIL_PASS: ${!!process.env.EMAIL_PASS}`);
        return false;
      }

      // Send email
      const mailOptions = {
        from: getFromAddress(),
        to: user.email,
        replyTo: process.env.EMAIL_USER || 'support@design2organize.net',
        subject: template.subject,
        html: template.html
      };

      console.log(`[Order Cancellation Email] Attempting to send email from ${getFromAddress()} to ${user.email} for order ${orderId}`);

      await transporter.sendMail(mailOptions);
      console.log(`[Order Cancellation Email] ✅ Successfully sent cancellation email to ${user.email} for order ${orderId}`);

      return true;
    } catch (error) {
      console.error(`[Order Cancellation Email] ❌ Error sending cancellation email for order ${orderId}:`, error);
      console.error(`[Order Cancellation Email] Error details:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        responseCode: error.responseCode
      });
      
      // Check for quota errors
      if (error.responseCode === 550 || (error.message && error.message.includes('quota'))) {
        console.error(`[Order Cancellation Email] ⚠️ QUOTA EXCEEDED: Email sending limit reached.`);
      }
      
      // Don't throw - email failure shouldn't break cancellation processing
      return false;
    }
  },

  // Send operations notification to admin/operations team
  async sendOperationsNotification(orderId, action, updatedBy) {
    try {
      // Get order and user details
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error('Error fetching order for operations email:', orderError);
        return false;
      }

      const user = order.users;
      if (!user) {
        console.error('No user found for order:', orderId);
        return false;
      }

      // Get operations team emails
      const { data: operationsUsers, error: usersError } = await supabase
        .from('users')
        .select('email')
        .in('role', ['operations', 'admin']);

      if (usersError || !operationsUsers || operationsUsers.length === 0) {
        console.error('No operations users found for notification');
        return false;
      }

      const operationsEmails = operationsUsers.map(u => u.email);

      // Get template
      const template = emailTemplates.operationsNotification(order, user, action, updatedBy);

      // Send email to operations team
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: operationsEmails.join(', '),
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Operations notification sent to ${operationsEmails.length} users for order ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error sending operations notification email:', error);
      return false;
    }
  },

  // Send bulk operations notification
  async sendBulkOperationsNotification(orderIds, action, updatedBy) {
    try {
      // Get operations team emails
      const { data: operationsUsers, error: usersError } = await supabase
        .from('users')
        .select('email')
        .in('role', ['operations', 'admin']);

      if (usersError || !operationsUsers || operationsUsers.length === 0) {
        console.error('No operations users found for bulk notification');
        return false;
      }

      const operationsEmails = operationsUsers.map(u => u.email);

      // Create bulk notification template
      const template = {
        subject: `Bulk Operations Alert: ${action} - ${orderIds.length} Orders`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #17a2b8;">
              <h1 style="color: #333; margin: 0;">Operations Dashboard</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Bulk Update Notification</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Operations Team,</h2>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                A bulk operation has been performed by ${updatedBy.email}.
              </p>
              
              <div style="background: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
                <h3 style="color: #333; margin-top: 0;">Bulk Update Details</h3>
                <p><strong>Action:</strong> ${action}</p>
                <p><strong>Orders Affected:</strong> ${orderIds.length}</p>
                <p><strong>Updated By:</strong> ${updatedBy.email}</p>
                <p><strong>Updated At:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div style="margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/fulfillment" 
                   style="background: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View in Dashboard
                </a>
              </div>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>© 2024 Design 2 Organize. All rights reserved.</p>
            </div>
          </div>
        `
      };

      // Send email to operations team
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: operationsEmails.join(', '),
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Bulk operations notification sent to ${operationsEmails.length} users for ${orderIds.length} orders`);
      return true;
    } catch (error) {
      console.error('Error sending bulk operations notification email:', error);
      return false;
    }
  },

  // Test email function
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: toEmail,
        subject: 'Email Service Test - Design 2 Organize',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #28a745;">
              <h1 style="color: #333; margin: 0;">Design 2 Organize</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Email Service Test</p>
            </div>
            
            <div style="padding: 30px 20px;">
              <h2 style="color: #333; margin-bottom: 20px;">Email Service Test</h2>
              
              <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
                This is a test email to verify that the email service is working correctly.
              </p>
              
              <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                <h3 style="color: #333; margin-top: 0;">Test Details</h3>
                <p><strong>Test Time:</strong> ${new Date().toLocaleString()}</p>
                <p><strong>Service:</strong> ${process.env.EMAIL_SERVICE || 'gmail'}</p>
                <p><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">SUCCESS</span></p>
              </div>
              
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                If you received this email, the email service is working correctly!
              </p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
              <p>© 2024 Design 2 Organize. All rights reserved.</p>
            </div>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log(`Test email sent to ${toEmail}`);
      return true;
    } catch (error) {
      console.error('Error sending test email:', error);
      return false;
    }
  },

  // Send order status update email to customer
  async sendOrderStatusEmail({ to, orderId, oldStatus, newStatus, trackingNumber, trackingCarrier }) {
    const subject = `Order #${orderId.slice(0, 8)} Status Update: ${newStatus.toUpperCase()}`;
    const html = `
      <h2>Your order status has changed!</h2>
      <p>Order <b>#${orderId.slice(0, 8)}</b> status updated from <b>${oldStatus}</b> to <b>${newStatus}</b>.</p>
      ${trackingNumber ? `<p>Tracking Number: <b>${trackingNumber}</b> (${trackingCarrier || 'Carrier'})</p>` : ''}
      <p>Thank you for shopping with us!</p>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      html
    });
  },

  // Send order confirmation email to customer
  async sendOrderConfirmation(orderId) {
    console.log(`[Order Confirmation Email] ========================================`);
    console.log(`[Order Confirmation Email] FUNCTION CALLED for order ${orderId}`);
    console.log(`[Order Confirmation Email] ========================================`);
    
    // Check if this order is currently being processed (prevent concurrent calls)
    if (ordersInProgress.has(orderId)) {
      console.log(`[Order Confirmation Email] ⚠️ Email sending already in progress for order ${orderId}. Waiting for existing process...`);
      try {
        // Wait for the existing process to complete
        const result = await ordersInProgress.get(orderId);
        console.log(`[Order Confirmation Email] Existing process completed for order ${orderId}. Result: ${result}`);
        return result;
      } catch (error) {
        console.error(`[Order Confirmation Email] Error waiting for existing process for order ${orderId}:`, error);
        // Continue with new attempt if waiting failed
      }
    }
    
    // Check in-memory cache first (fast check)
    if (confirmationEmailsSent.has(orderId)) {
      console.log(`[Order Confirmation Email] ⚠️ Email already sent for order ${orderId} (in-memory cache). Skipping to prevent duplicate.`);
      return true;
    }
    
    // Create a promise for this order and store it (prevents concurrent processing)
    const emailPromise = (async () => {
      try {
        // RACE CONDITION FIX: Try to create audit log entry FIRST (atomic operation)
        // This prevents multiple concurrent requests from all sending emails
        // We use a "lock" entry that we create before sending
        const lockId = `email_lock_${orderId}_${Date.now()}`;
        let lockAcquired = false;
        
        try {
      // Try to insert a "lock" entry - if this succeeds, we're the first one
      const { data: lockEntry, error: lockError } = await supabase
        .from('order_audit_log')
        .insert({
          order_id: orderId,
          action: 'CONFIRMATION_EMAIL_SENT',
          old_values: JSON.stringify({}),
          new_values: JSON.stringify({ lock_id: lockId, status: 'sending' }),
          updated_by: null, // Will be set after we get order data
          notes: `Email sending in progress (lock: ${lockId})`
        })
        .select()
        .single();
      
      if (!lockError && lockEntry) {
        lockAcquired = true;
        console.log(`[Order Confirmation Email] ✅ Acquired lock for order ${orderId}. Proceeding with email send.`);
      } else {
        // Lock acquisition failed - check if email was already sent
        console.log(`[Order Confirmation Email] ⚠️ Could not acquire lock for order ${orderId}. Checking if email was already sent...`);
        
        const { data: existingLog, error: checkError } = await supabase
          .from('order_audit_log')
          .select('id, notes')
          .eq('order_id', orderId)
          .eq('action', 'CONFIRMATION_EMAIL_SENT')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (!checkError && existingLog) {
          // Check if it's a completed email (not just a lock)
          const newValues = typeof existingLog.notes === 'string' && existingLog.notes.includes('sent to') 
            ? true 
            : (existingLog.notes && !existingLog.notes.includes('lock'));
          
          if (newValues || existingLog.notes?.includes('sent to')) {
            console.log(`[Order Confirmation Email] ⚠️ Email already sent for order ${orderId} (found existing entry). Skipping to prevent duplicate.`);
            confirmationEmailsSent.add(orderId);
            return true;
          }
        }
        
        // If we get here, lock failed but no completed email found
        // This might be a race condition - wait a moment and check again
        console.log(`[Order Confirmation Email] ⚠️ Lock acquisition failed but no completed email found. Waiting 500ms and re-checking...`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const { data: recheckLog } = await supabase
          .from('order_audit_log')
          .select('id, notes')
          .eq('order_id', orderId)
          .eq('action', 'CONFIRMATION_EMAIL_SENT')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (recheckLog && (recheckLog.notes?.includes('sent to') || !recheckLog.notes?.includes('lock'))) {
          console.log(`[Order Confirmation Email] ⚠️ Email was sent by another process. Skipping to prevent duplicate.`);
          confirmationEmailsSent.add(orderId);
          return true;
        }
        
        // Still no completed email - proceed but log warning
        console.warn(`[Order Confirmation Email] ⚠️ Proceeding despite lock failure - possible race condition for order ${orderId}`);
      }
        } catch (lockCheckError) {
          console.error(`[Order Confirmation Email] Error during lock acquisition for order ${orderId}:`, lockCheckError);
          // Continue anyway - better to send duplicate than miss an email
        }
        
        console.log(`[Order Confirmation Email] Starting email send for order ${orderId}`);
      
      // Fetch complete order data with user information
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select(`
          *,
          users!orders_user_id_fkey (
            id,
            email,
            name
          )
        `)
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        console.error(`[Order Confirmation Email] Error fetching order ${orderId}:`, orderError);
        return false;
      }

      const user = order.users;
      if (!user || !user.email) {
        console.error(`[Order Confirmation Email] No user or email found for order ${orderId}. User:`, user);
        return false;
      }

      console.log(`[Order Confirmation Email] Found user ${user.email} for order ${orderId}`);

      // Parse cart items from cart_json
      let cartItems = [];
      try {
        cartItems = Array.isArray(order.cart_json) ? order.cart_json : JSON.parse(order.cart_json || '[]');
        console.log(`[Order Confirmation Email] Parsed ${cartItems.length} cart items for order ${orderId}`);
      } catch (parseError) {
        console.error(`[Order Confirmation Email] Error parsing cart_json for order ${orderId}:`, parseError);
        cartItems = [];
      }

      // Get email template
      const template = emailTemplates.orderConfirmation(order, user, cartItems);
      console.log(`[Order Confirmation Email] Generated email template for order ${orderId}`);

      // Validate email address
      if (!user.email || !user.email.includes('@')) {
        console.error(`[Order Confirmation Email] Invalid email address for order ${orderId}: ${user.email}`);
        return false;
      }

      // Check if email service is configured
      if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.error(`[Order Confirmation Email] Email service not configured. EMAIL_USER: ${!!process.env.EMAIL_USER}, EMAIL_PASS: ${!!process.env.EMAIL_PASS}`);
        return false;
      }

      // Send email from support@design2organize.net with proper display name
      const mailOptions = {
        from: getFromAddress(),
        to: user.email,
        replyTo: process.env.EMAIL_USER || 'support@design2organize.net',
        subject: template.subject,
        html: template.html
      };

      console.log(`[Order Confirmation Email] Attempting to send email from ${getFromAddress()} to ${user.email} for order ${orderId}`);
      
      // Send email with retry logic for connection limit errors
      let retries = 3;
      let lastError = null;
      
      while (retries > 0) {
        try {
          await transporter.sendMail(mailOptions);
          console.log(`[Order Confirmation Email] Successfully sent confirmation email to ${user.email} for order ${orderId}`);
          lastError = null;
          break; // Success, exit retry loop
        } catch (sendError) {
          lastError = sendError;
          
          // Check if it's a concurrent connection error (432)
          if (sendError.responseCode === 432 || (sendError.message && sendError.message.includes('Concurrent connections limit'))) {
            retries--;
            if (retries > 0) {
              const waitTime = (4 - retries) * 2000; // Exponential backoff: 2s, 4s, 6s
              console.warn(`[Order Confirmation Email] ⚠️ Concurrent connection limit error (432) for order ${orderId}. Retrying in ${waitTime}ms... (${retries} retries left)`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            } else {
              console.error(`[Order Confirmation Email] ❌ Failed to send email after 3 retries due to concurrent connection limit for order ${orderId}`);
              throw sendError;
            }
          } else {
            // Not a connection limit error, don't retry
            throw sendError;
          }
        }
      }
      
      if (lastError) {
        throw lastError;
      }
      
      // Mark this order as having confirmation email sent (prevent duplicates)
      // 1. Add to in-memory cache
      confirmationEmailsSent.add(orderId);
      
      // 2. Update the lock entry to mark email as successfully sent
      if (lockAcquired) {
        try {
          // Update the lock entry we created earlier
          const { error: updateError } = await supabase
            .from('order_audit_log')
            .update({
              new_values: JSON.stringify({ email_sent: true, sent_at: new Date().toISOString(), lock_id: lockId }),
              updated_by: order.user_id,
              notes: `Order confirmation email sent to ${user.email}`
            })
            .eq('order_id', orderId)
            .eq('action', 'CONFIRMATION_EMAIL_SENT')
            .like('notes', `%lock: ${lockId}%`);
          
          if (updateError) throw updateError;
          console.log(`[Order Confirmation Email] Updated lock entry to completed status for order ${orderId}`);
        } catch (updateError) {
          // If update fails, try to insert a new entry
          try {
            await supabase
              .from('order_audit_log')
              .insert({
                order_id: orderId,
                action: 'CONFIRMATION_EMAIL_SENT',
                old_values: JSON.stringify({}),
                new_values: JSON.stringify({ email_sent: true, sent_at: new Date().toISOString() }),
                updated_by: order.user_id,
                notes: `Order confirmation email sent to ${user.email}`
              });
            console.log(`[Order Confirmation Email] Created new audit log entry for order ${orderId}`);
          } catch (insertError) {
            console.warn(`[Order Confirmation Email] Failed to create/update audit log entry for order ${orderId}:`, insertError.message);
          }
        }
      } else {
        // If we didn't acquire lock, still try to create entry (might fail if duplicate, that's OK)
        try {
          await supabase
            .from('order_audit_log')
            .insert({
              order_id: orderId,
              action: 'CONFIRMATION_EMAIL_SENT',
              old_values: JSON.stringify({}),
              new_values: JSON.stringify({ email_sent: true, sent_at: new Date().toISOString() }),
              updated_by: order.user_id,
              notes: `Order confirmation email sent to ${user.email}`
            });
          console.log(`[Order Confirmation Email] Created audit log entry for order ${orderId}`);
        } catch (auditError) {
          // If insert fails, it might be because another process already created it - that's OK
          console.log(`[Order Confirmation Email] Could not create audit log entry (may already exist):`, auditError.message);
        }
      }
      
      console.log(`[Order Confirmation Email] Marked order ${orderId} as having confirmation email sent (in-memory + database)`);
      
      return true;
    } catch (error) {
      console.error(`[Order Confirmation Email] Error sending confirmation email for order ${orderId}:`, error);
      console.error(`[Order Confirmation Email] Error details:`, {
        message: error.message,
        stack: error.stack,
        code: error.code,
        responseCode: error.responseCode
      });
      
      // Check for quota errors (550 response code)
      if (error.responseCode === 550 || (error.message && error.message.includes('quota'))) {
        console.error(`[Order Confirmation Email] ⚠️ QUOTA EXCEEDED: Email sending limit reached.`);
        console.error(`[Order Confirmation Email] This means authentication is working, but GoDaddy email quota limit has been reached.`);
        console.error(`[Order Confirmation Email] Wait 1 hour for quota reset, or upgrade your GoDaddy email plan.`);
      }
      
      // Don't throw - email failure shouldn't break order processing
      return false;
      } finally {
        // Remove from in-progress map when done (success or failure)
        ordersInProgress.delete(orderId);
        console.log(`[Order Confirmation Email] Removed order ${orderId} from in-progress tracking`);
      }
    })();
    
    // Store the promise so concurrent calls can wait for it
    ordersInProgress.set(orderId, emailPromise);
    
    // Execute and return the result
    return await emailPromise;
  }
};

module.exports = emailService; 