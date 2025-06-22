const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole } = require('../middleware/auth');
const emailService = require('../services/emailService');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Apply authentication and role check to all fulfillment routes
console.log('Authenticating fulfillment routes', authenticateToken);
router.use(authenticateToken);
router.use(requireRole('operations'));

// Get all orders with filtering and pagination
router.get('/orders', async (req, res) => {
  try {
    const {
      status,
      search,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query;
    if (search) {
      // Use the RPC function for searching
      query = supabase.rpc('search_orders', { search_term: search });
    } else {
      // Use the standard query for non-search requests
      query = supabase.from('orders');
    }

    // Always select the data and the related user info
    query = query.select(`
      *,
      users (
        id,
        email,
        name
      )
    `);

    // Apply status filter (cannot be done in the RPC easily without more complexity)
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: orders, error, count } = await query;

    if (error) throw error;

    // The RPC call doesn't provide a total count, so we have to do a separate count query.
    // This is a limitation we accept for now to get search working.
    // For a full implementation, the RPC would also return a count.
    const { count: totalCount } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error.message
    });
  }
});

// Get single order by ID
router.get('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: order, error } = await supabase
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

    if (error) throw error;

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    res.json({
      success: true,
      order
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error.message
    });
  }
});

// Update order status and tracking
router.patch('/orders/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { 
      status, 
      tracking_number, 
      tracking_carrier, 
      notes, 
      blocker_reason 
    } = req.body;

    // Validate status
    const validStatuses = ['pending', 'in_progress', 'fulfilled', 'blocked', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    // Fetch the current order for old status and values
    const { data: oldOrder, error: oldOrderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (oldOrderError || !oldOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Build update object
    const updateData = {};
    if (status) updateData.status = status;
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (tracking_carrier) updateData.tracking_carrier = tracking_carrier;
    if (notes !== undefined) updateData.notes = notes;
    if (blocker_reason !== undefined) updateData.blocker_reason = blocker_reason;

    // Add audit trail metadata to the order itself
    updateData.last_updated_by = req.user.id;
    updateData.last_updated_at = new Date().toISOString();

    const { data: updatedOrder, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select(`
        *,
        users!orders_user_id_fkey (
          id,
          email,
          name
        )
      `)
      .single();

    if (error) throw error;

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: 'Order not found after update'
      });
    }

    // Create a more detailed audit log entry
    const auditLogPayload = {
      order_id: orderId,
      updated_by: req.user.id,
      notes: `Order fields updated by ${req.user.email}.`,
      old_values: {},
      new_values: {},
      action: 'ORDER_UPDATED' // Default action
    };

    if (status && status !== oldOrder.status) {
      auditLogPayload.action = 'STATUS_CHANGED';
      auditLogPayload.notes = `Status changed from ${oldOrder.status} to ${status} by ${req.user.email}.`;
      auditLogPayload.old_values.status = oldOrder.status;
      auditLogPayload.new_values.status = status;
    }
    
    if (tracking_number && tracking_number !== oldOrder.tracking_number) {
        auditLogPayload.action = 'TRACKING_UPDATED';
        auditLogPayload.notes = `Tracking number updated by ${req.user.email}.`;
        auditLogPayload.old_values.tracking_number = oldOrder.tracking_number;
        auditLogPayload.new_values.tracking_number = tracking_number;
    }

    // Serialize old_values and new_values as JSON strings
    auditLogPayload.old_values = JSON.stringify(auditLogPayload.old_values);
    auditLogPayload.new_values = JSON.stringify(auditLogPayload.new_values);

    await supabase.from('order_audit_log').insert(auditLogPayload);

    // EMAIL NOTIFICATIONS
    if (status && status !== oldOrder.status) {
      // Status changed
      await emailService.sendOrderStatusUpdate(orderId, oldOrder.status, status, req.user);
      if (status === 'blocked') {
        await emailService.sendOrderBlockedNotification(orderId, blocker_reason, req.user);
      } else if (status === 'cancelled') {
        await emailService.sendOrderCancelledNotification(orderId, notes, req.user);
      } else if (status === 'fulfilled' && updatedOrder.tracking_number) {
        await emailService.sendTrackingUpdate(orderId, req.user);
      }
    } else if (tracking_number && status === oldOrder.status) {
      // Tracking number added/updated but status didn't change
      await emailService.sendTrackingUpdate(orderId, req.user);
    }
    // Optionally, notify operations team
    await emailService.sendOperationsNotification(orderId, status || 'update', req.user);

    res.json({
      success: true,
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order',
      error: error.message
    });
  }
});

// Get order audit log
router.get('/orders/:orderId/audit', async (req, res) => {
  try {
    const { orderId } = req.params;

    const { data: auditLog, error } = await supabase
      .from('order_audit_log')
      .select(`
        *,
        users!order_audit_log_updated_by_fkey (
          id,
          email,
          name
        )
      `)
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      success: true,
      auditLog
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit log',
      error: error.message
    });
  }
});

// Bulk update orders (for batch operations)
router.patch('/orders/bulk', async (req, res) => {
  try {
    const { orderIds, updates } = req.body;

    if (!Array.isArray(orderIds) || orderIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'orderIds must be a non-empty array'
      });
    }

    // Validate status if provided
    if (updates.status) {
      const validStatuses = ['pending', 'in_progress', 'fulfilled', 'blocked', 'cancelled'];
      if (!validStatuses.includes(updates.status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
        });
      }
    }

    // Add audit info
    const updateData = {
      ...updates,
      last_updated_by: req.user.id,
      last_updated_at: new Date().toISOString()
    };

    const { data: orders, error } = await supabase
      .from('orders')
      .update(updateData)
      .in('id', orderIds)
      .select();

    if (error) throw error;

    // Create audit log entries for each order
    const auditEntries = orderIds.map(orderId => ({
      order_id: orderId,
      action: 'bulk_update',
      old_values: JSON.stringify({}),
      new_values: JSON.stringify(updateData),
      updated_by: req.user.id,
      notes: `Bulk update by ${req.user.email}`
    }));

    await supabase
      .from('order_audit_log')
      .insert(auditEntries);

    res.json({
      success: true,
      message: `Updated ${orders.length} orders successfully`,
      updatedCount: orders.length
    });
  } catch (error) {
    console.error('Error bulk updating orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update orders',
      error: error.message
    });
  }
});

// Get fulfillment statistics
router.get('/stats', async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Get orders in the last N days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    const { data: orders, error } = await supabase
      .from('orders')
      .select('status, created_at')
      .gte('created_at', startDate.toISOString());

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      in_progress: orders.filter(o => o.status === 'in_progress').length,
      fulfilled: orders.filter(o => o.status === 'fulfilled').length,
      blocked: orders.filter(o => o.status === 'blocked').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Calculate fulfillment rate
    stats.fulfillment_rate = stats.total > 0 
      ? ((stats.fulfilled / stats.total) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      stats,
      period: `${period} days`
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
});

module.exports = router; 