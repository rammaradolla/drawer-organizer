const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  orderStatusUpdate: (order, user, oldStatus, newStatus) => ({
    subject: `Order #${order.id.slice(0, 8)} Status Updated - ${newStatus.toUpperCase()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #007bff;">
          <h1 style="color: #333; margin: 0;">Drawer Organizer</h1>
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
          <p>© 2024 Drawer Organizer. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  trackingUpdate: (order, user) => ({
    subject: `Tracking Information Added - Order #${order.id.slice(0, 8)}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #28a745;">
          <h1 style="color: #333; margin: 0;">Drawer Organizer</h1>
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
          <p>© 2024 Drawer Organizer. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  orderBlocked: (order, user, blockerReason) => ({
    subject: `Order #${order.id.slice(0, 8)} - Action Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #dc3545;">
          <h1 style="color: #333; margin: 0;">Drawer Organizer</h1>
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
          <p>© 2024 Drawer Organizer. All rights reserved.</p>
        </div>
      </div>
    `
  }),

  orderCancelled: (order, user, reason) => ({
    subject: `Order #${order.id.slice(0, 8)} Cancelled`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #6c757d;">
          <h1 style="color: #333; margin: 0;">Drawer Organizer</h1>
          <p style="color: #666; margin: 10px 0 0 0;">Order Cancellation Notice</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Hello ${user.name || user.email},</h2>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            Your order has been cancelled as requested.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6c757d;">
            <h3 style="color: #333; margin-top: 0;">Cancellation Details</h3>
            <p><strong>Order ID:</strong> ${order.id.slice(0, 8)}</p>
            <p><strong>Status:</strong> <span style="color: #6c757d; font-weight: bold;">CANCELLED</span></p>
            ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
            <p><strong>Refund:</strong> A refund will be processed within 5-7 business days</p>
          </div>
          
          <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
            If you have any questions about the cancellation or refund process, please don't hesitate to contact us.
          </p>
          
          <div style="margin: 30px 0;">
            <a href="mailto:${process.env.EMAIL_USER}?subject=Order ${order.id.slice(0, 8)} - Cancellation Question" 
               style="background: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Contact Support
            </a>
          </div>
        </div>
        
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 Drawer Organizer. All rights reserved.</p>
        </div>
      </div>
    `
  }),

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
          <p>© 2024 Drawer Organizer. All rights reserved.</p>
        </div>
      </div>
    `
  })
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

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order status update email sent to ${user.email} for order ${orderId}`);
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

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Tracking update email sent to ${user.email} for order ${orderId}`);
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

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order blocked email sent to ${user.email} for order ${orderId}`);
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

      // Get template
      const template = emailTemplates.orderCancelled(order, user, reason);

      // Send email
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: template.subject,
        html: template.html
      };

      await transporter.sendMail(mailOptions);
      console.log(`Order cancelled email sent to ${user.email} for order ${orderId}`);
      return true;
    } catch (error) {
      console.error('Error sending order cancelled email:', error);
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
              <p>© 2024 Drawer Organizer. All rights reserved.</p>
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
        subject: 'Email Service Test - Drawer Organizer',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #f8f9fa; padding: 20px; text-align: center; border-bottom: 3px solid #28a745;">
              <h1 style="color: #333; margin: 0;">Drawer Organizer</h1>
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
              <p>© 2024 Drawer Organizer. All rights reserved.</p>
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
  }
};

module.exports = emailService; 