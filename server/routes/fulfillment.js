const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireAnyRole } = require('../middleware/auth');
const emailService = require('../services/emailService');
const { getCustomerFacingStatus, ALL_OPERATIONAL_STATUSES } = require('../utils/statusConstants');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Apply authentication and role check to all fulfillment routes
console.log('Authenticating fulfillment routes', authenticateToken);
router.use(authenticateToken);
router.use(requireAnyRole(['operations', 'admin', 'department_head', 'department_member']));

// Define operational stages for use in auto-population
const OPERATIONAL_STAGES = [
  "Awaiting Payment",
  "Payment Confirmed",
  "Design Review",
  "Material Sourcing",
  "Cutting & Milling",
  "Assembly",
  "Sanding & Finishing",
  "Final Quality Check",
  "Packaging",
  "Awaiting Carrier Pickup",
  "Shipped",
  "Delivered",
  "Blocked",
  "Cancelled"
];

// Get all orders with optional filtering
router.get('/orders', async (req, res) => {
  try {
    const {
      status,
      granular_status,
      search,
      assignee,
      page = 1,
      limit = 20,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    // Role-based filtering
    if (req.user.role === 'department_head' || req.user.role === 'department_member') {
      query = query.eq('assignee_id', req.user.id);
    }

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (granular_status && granular_status !== 'all') {
      query = query.eq('granular_status', granular_status);
    }
    if (assignee && assignee !== 'all') {
      query = query.eq('assignee_id', assignee);
    }
    if (search) {
      // Use textSearch for composable full-text search.
      // The 'fts' column in the 'orders' table should be a tsvector.
      // The 'english' argument is the text search configuration.
      query = query.textSearch('fts', search, {
        type: 'websearch',
        config: 'english'
      });
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

    if (orders && Array.isArray(orders)) {
      // Collect all unique user IDs and assignee IDs
      const allUserIds = Array.from(new Set([
        ...orders.map(order => order.user_id).filter(Boolean),
        ...orders.map(order => order.assignee_id).filter(Boolean)
      ]));

      let userMap = {};
      let deptHeadMap = {};

      if (allUserIds.length > 0) {
        // Fetch from users
        const { data: usersData } = await supabase
          .from('users')
          .select('id, name, email')
          .in('id', allUserIds);
        if (usersData) {
          usersData.forEach(u => { userMap[u.id] = u; });
        }

        // Fetch from department_heads for any missing
        const missingIds = allUserIds.filter(id => !userMap[id]);
        if (missingIds.length > 0) {
          const { data: deptHeadsData } = await supabase
            .from('department_heads')
            .select('id, name, email')
            .in('id', missingIds);
          if (deptHeadsData) {
            deptHeadsData.forEach(dh => { deptHeadMap[dh.id] = dh; });
          }
        }
      }

      orders.forEach(order => {
        // Attach assignee user object for direct assignee_id
        if (order.assignee_id) {
          order.assignee = userMap[order.assignee_id] || deptHeadMap[order.assignee_id] || null;
        } else {
          order.assignee = null;
        }
        // Attach customer user object
        if (order.user_id) {
          order.users = userMap[order.user_id] || null;
        } else {
          order.users = null;
        }
        console.log('Order assignee:', order.assignee, order);
      });
    }

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
        ),
        assignee:users!orders_assignee_id_fkey (
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

    if (order && order.assignee_id && (!order.stage_assignees || Object.keys(order.stage_assignees).length === 0)) {
      order.stage_assignees = {};
      OPERATIONAL_STAGES.forEach(stage => {
        order.stage_assignees[stage] = order.assignee_id;
      });
    }

    if (order && order.stage_assignees && Object.values(order.stage_assignees).length > 0) {
      const assigneeIds = Array.from(new Set(Object.values(order.stage_assignees)));
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, name, email')
        .in('id', assigneeIds);
      const userMap = {};
      if (usersData) {
        usersData.forEach(u => { userMap[u.id] = u; });
      }
      // Find missing IDs
      const missingIds = assigneeIds.filter(id => !userMap[id]);
      let deptHeadMap = {};
      if (missingIds.length > 0) {
        const { data: deptHeadsData } = await supabase
          .from('department_heads')
          .select('id, name, email, phone, stage')
          .in('id', missingIds);
        if (deptHeadsData) {
          deptHeadsData.forEach(dh => { deptHeadMap[dh.id] = dh; });
        }
      }
      order.stage_assignees_info = {};
      Object.entries(order.stage_assignees).forEach(([stage, id]) => {
        order.stage_assignees_info[stage] = userMap[id] || deptHeadMap[id] || null;
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
      granular_status,
      tracking_number, 
      tracking_carrier, 
      notes, 
      blocker_reason,
      assignee_id,
      stage_assignees
    } = req.body;

    // Validate status
    if (granular_status && !ALL_OPERATIONAL_STATUSES.includes(granular_status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid granular_status. Must be one of: ${ALL_OPERATIONAL_STATUSES.join(', ')}`
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
    if (granular_status) {
      updateData.granular_status = granular_status;
      updateData.status = getCustomerFacingStatus(granular_status);
      // Find department head for the new stage using the new department_head_stages join table
      const { data: stageAssignment } = await supabase
        .from('department_head_stages')
        .select('department_head_id')
        .eq('stage', granular_status)
        .single();
      
      if (stageAssignment && stageAssignment.department_head_id) {
        updateData.assignee_id = stageAssignment.department_head_id;
      } else {
        updateData.assignee_id = null;
        console.warn('No department head found for stage:', granular_status);
      }
      updateData.task_status = 'in-progress'; // Reset task status for new stage
      updateData.assigned_at = new Date().toISOString();
    }
    if (tracking_number) updateData.tracking_number = tracking_number;
    if (tracking_carrier) updateData.tracking_carrier = tracking_carrier;
    if (notes !== undefined) updateData.notes = notes;
    if (blocker_reason !== undefined) updateData.blocker_reason = blocker_reason;
    if (assignee_id !== undefined) updateData.assignee_id = assignee_id;
    if (stage_assignees !== undefined) updateData.stage_assignees = stage_assignees;

    // Add audit trail metadata to the order itself
    updateData.last_updated_by = req.user.id;
    updateData.last_updated_at = new Date().toISOString();

    // --- Begin Stage Assignment Logic ---
    if (granular_status && granular_status !== oldOrder.granular_status) {
      // Find the index of the new and previous stage
      const newStageIdx = OPERATIONAL_STAGES.indexOf(granular_status);
      const prevStageIdx = OPERATIONAL_STAGES.indexOf(oldOrder.granular_status);
      const prevStage = OPERATIONAL_STAGES[prevStageIdx];
      const nextStage = OPERATIONAL_STAGES[newStageIdx];

      // Use the most up-to-date stage_assignees (from update or old order)
      let currentStageAssignees = stage_assignees !== undefined ? stage_assignees : (oldOrder.stage_assignees || {});

      // If moving to a new stage and next stage's assignee is not set, auto-assign it to department head
      if (prevStageIdx >= 0 && newStageIdx > prevStageIdx) {
        if (!currentStageAssignees[nextStage]) {
          // Fetch department head for the next stage using the new department_head_stages join table
          const { data: stageAssignment } = await supabase
            .from('department_head_stages')
            .select('department_head_id')
            .eq('stage', nextStage)
            .single();
          if (stageAssignment && stageAssignment.department_head_id) {
            currentStageAssignees[nextStage] = stageAssignment.department_head_id;
          }
        }
      }

      // Save the updated stage_assignees
      updateData.stage_assignees = currentStageAssignees;
    }
    // --- End Stage Assignment Logic ---

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
        ),
        assignee:users!orders_assignee_id_fkey (
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
      new_values: {}
    };

    if (granular_status && granular_status !== oldOrder.granular_status) {
      auditLogPayload.action = 'STATUS_CHANGED';
      auditLogPayload.notes = `Status changed from ${oldOrder.granular_status} to ${granular_status} by ${req.user.email}.`;
      auditLogPayload.old_values.granular_status = oldOrder.granular_status;
      auditLogPayload.new_values.granular_status = granular_status;
      auditLogPayload.old_values.status = oldOrder.status;
      auditLogPayload.new_values.status = updatedOrder.status;
    }
    
    if (tracking_number && tracking_number !== oldOrder.tracking_number) {
        auditLogPayload.action = 'TRACKING_UPDATED';
        auditLogPayload.notes = `Tracking number updated by ${req.user.email}.`;
        auditLogPayload.old_values.tracking_number = oldOrder.tracking_number;
        auditLogPayload.new_values.tracking_number = tracking_number;
    }

    if (assignee_id && assignee_id !== oldOrder.assignee_id) {
      auditLogPayload.action = 'ASSIGNEE_CHANGED';
      auditLogPayload.notes = `Assignee changed by ${req.user.email}.`;
      auditLogPayload.old_values.assignee_id = oldOrder.assignee_id;
      auditLogPayload.new_values.assignee_id = assignee_id;
    }

    if (stage_assignees && JSON.stringify(stage_assignees) !== JSON.stringify(oldOrder.stage_assignees || {})) {
      auditLogPayload.action = 'STAGE_ASSIGNEES_CHANGED';
      auditLogPayload.notes = `Stage assignees updated by ${req.user.email}.`;
      auditLogPayload.old_values.stage_assignees = oldOrder.stage_assignees || {};
      auditLogPayload.new_values.stage_assignees = stage_assignees;
    }

    // If we have changes, insert an audit log.
    if (Object.keys(auditLogPayload.new_values).length > 0) {
      auditLogPayload.old_values = JSON.stringify(auditLogPayload.old_values);
      auditLogPayload.new_values = JSON.stringify(auditLogPayload.new_values);
  
      const { error: auditError } = await supabase.from('order_audit_log').insert(auditLogPayload);
  
      if (auditError) {
        // Non-blocking: We will report this error but not fail the whole request.
        console.error('Failed to insert audit log:', auditError.message);
      }
    }

    // EMAIL NOTIFICATIONS
    try {
      if (granular_status && granular_status !== oldOrder.granular_status) {
        // Status changed
        await emailService.sendOrderStatusUpdate(orderId, oldOrder.status, updatedOrder.status, req.user);
        if (updatedOrder.status === 'blocked') {
          await emailService.sendOrderBlockedNotification(orderId, blocker_reason, req.user);
        } else if (updatedOrder.status === 'cancelled') {
          await emailService.sendOrderCancelledNotification(orderId, notes, req.user);
        } else if (updatedOrder.status === 'fulfilled' && updatedOrder.tracking_number) {
          await emailService.sendTrackingUpdate(orderId, req.user);
        }
      } else if (tracking_number && granular_status === oldOrder.granular_status) {
        // Tracking number added/updated but status didn't change
        await emailService.sendTrackingUpdate(orderId, req.user);
      }
      // Optionally, notify operations team
      await emailService.sendOperationsNotification(orderId, granular_status || 'update', req.user);
    } catch (emailError) {
      console.error('Email notification failed, but continuing request. Error:', emailError.message);
    }

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

// Get operations users
router.get('/operations-users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email')
      .eq('role', 'operations');

    if (error) throw error;

    res.json({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Error fetching operations users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch operations users',
      error: error.message,
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

router.get('/department-heads', authenticateToken, requireAnyRole(['admin', 'operations', 'department_head', 'department_member']), async (req, res) => {
  try {
    // List of all operational stages
    const ALL_STAGES = [
      "Awaiting Payment",
      "Payment Confirmed",
      "Design Review",
      "Material Sourcing",
      "Cutting & Milling",
      "Assembly",
      "Sanding & Finishing",
      "Final Quality Check",
      "Packaging",
      "Awaiting Carrier Pickup",
      "Shipped",
      "Delivered",
      "Blocked",
      "Cancelled"
    ];
    // Fetch all department head stage assignments
    const { data: stageAssignments, error: stagesError } = await supabase.from('department_head_stages').select('department_head_id, stage');
    if (stagesError) return res.status(500).json({ success: false, error: stagesError.message });
    // Fetch all department heads (with user info)
    const { data: heads, error: headsError } = await supabase.from('department_heads').select('id, name, email, phone');
    if (headsError) return res.status(500).json({ success: false, error: headsError.message });
    // Build a map from department_head_id to head info
    const headMap = {};
    heads.forEach(h => { headMap[h.id] = h; });
    // Build the result: one row per stage
    const result = ALL_STAGES.map(stage => {
      const assignment = stageAssignments.find(sa => sa.stage === stage);
      if (assignment && headMap[assignment.department_head_id]) {
        const head = headMap[assignment.department_head_id];
        return {
          stage,
          department_head_id: head.id,
          name: head.name,
          email: head.email,
          phone: head.phone
        };
      } else {
        return {
          stage,
          department_head_id: null,
          name: null,
          email: null,
          phone: null
        };
      }
    });
    res.json({ success: true, department_heads: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /orders/:orderId/task-status
router.patch('/orders/:orderId/task-status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { task_status } = req.body;
    const allowedStatuses = ['in-progress', 'complete', 'blocked'];
    if (!allowedStatuses.includes(task_status)) {
      return res.status(400).json({ success: false, message: `Invalid task_status. Must be one of: ${allowedStatuses.join(', ')}` });
    }

    // Fetch the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (orderError || !order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Only assigned department head or member can update
    if (
      req.user.id !== order.current_department_head_id &&
      req.user.id !== order.current_department_member_id
    ) {
      return res.status(403).json({ success: false, message: 'Access denied. Only assigned department head or member can update task status.' });
    }

    // Prepare update object
    const updateData = { task_status, last_updated_by: req.user.id, last_updated_at: new Date().toISOString() };
    let nextStageAssigned = false;
    let auditNote = `Task status updated to ${task_status} by ${req.user.email}`;

    // If status is 'complete', move to next stage and assign to next department head
    if (task_status === 'complete') {
      const OPERATIONAL_STAGES = [
        "Awaiting Payment",
        "Payment Confirmed",
        "Design Review",
        "Material Sourcing",
        "Cutting & Milling",
        "Assembly",
        "Sanding & Finishing",
        "Final Quality Check",
        "Packaging",
        "Awaiting Carrier Pickup",
        "Shipped",
        "Delivered",
        "Blocked",
        "Cancelled"
      ];
      const currentStageIdx = OPERATIONAL_STAGES.indexOf(order.granular_status);
      if (currentStageIdx >= 0 && currentStageIdx < OPERATIONAL_STAGES.length - 1) {
        const nextStage = OPERATIONAL_STAGES[currentStageIdx + 1];
        // Find department head for next stage using the new department_head_stages join table
        const { data: stageAssignment } = await supabase
          .from('department_head_stages')
          .select('department_head_id')
          .eq('stage', nextStage)
          .single();
        if (stageAssignment && stageAssignment.department_head_id) {
          updateData.current_department_head_id = stageAssignment.department_head_id;
          updateData.current_department_member_id = null;
          updateData.granular_status = nextStage;
          updateData.status = require('../utils/statusConstants').getCustomerFacingStatus(nextStage);
          updateData.assigned_at = new Date().toISOString();
          nextStageAssigned = true;
          auditNote += `. Order moved to next stage: ${nextStage}`;
        }
      }
    }

    // Update the order
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single();
    if (updateError) throw updateError;

    // Log the change in audit log
    await supabase.from('order_audit_log').insert([
      {
        order_id: orderId,
        action: 'TASK_STATUS_UPDATED',
        old_values: { task_status: order.task_status },
        new_values: { task_status },
        updated_by: req.user.id,
        notes: auditNote,
        created_at: new Date().toISOString()
      }
    ]);

    res.json({ success: true, order: updatedOrder, nextStageAssigned });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ success: false, message: 'Failed to update task status', error: error.message });
  }
});

// Get department members for a given stage
router.get('/department-members', authenticateToken, requireAnyRole(['admin', 'operations', 'department_head']), async (req, res) => {
  const { stage } = req.query;
  if (!stage) return res.status(400).json({ success: false, message: 'Stage is required' });

  // Find members for this stage
  const { data: members, error: membersError } = await supabase
    .from('department_members')
    .select('id, name, email, stage')
    .eq('stage', stage);

  if (membersError) return res.status(500).json({ success: false, message: membersError.message });

  // Filter by role in the users table
  const memberIds = members.map(m => m.id);
  let filteredMembers = [];
  if (memberIds.length > 0) {
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, role')
      .in('id', memberIds)
      .eq('role', 'department_member');
    if (usersError) return res.status(500).json({ success: false, message: usersError.message });
    const validUserIds = new Set((users || []).map(u => u.id));
    filteredMembers = members.filter(m => validUserIds.has(m.id));
  }

  res.json({ success: true, members: filteredMembers });
});

// Assign a department member to an order
router.patch('/orders/:orderId/assign-member', authenticateToken, requireAnyRole(['admin', 'operations', 'department_head']), async (req, res) => {
  const { orderId } = req.params;
  const { memberId } = req.body;
  if (!memberId) return res.status(400).json({ success: false, message: 'memberId is required' });

  // Fetch the order
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Only the department head for this order can assign
  if (req.user.role !== 'admin' && req.user.role !== 'operations' && req.user.id !== order.current_department_head_id) {
    return res.status(403).json({ success: false, message: 'Only the department head for this order can assign a member.' });
  }

  // Assign the member
  const { error: updateError } = await supabase
    .from('orders')
    .update({
      current_department_member_id: memberId,
      assigned_at: new Date().toISOString(),
      task_status: 'in-progress'
    })
    .eq('id', orderId);
  if (updateError) return res.status(500).json({ success: false, message: updateError.message });

  res.json({ success: true, message: 'Member assigned.' });
});

module.exports = router; 