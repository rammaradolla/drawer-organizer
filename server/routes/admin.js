const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole, requireAnyRole } = require('../middleware/auth');
const db = require('../utils/db');
const jwt = require('jsonwebtoken');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Protect all routes in this file, only admins can access
router.use(authenticateToken);

// GET /api/admin/users - Fetches users, can filter by role
router.get('/users', requireRole('admin'), async (req, res) => {
  const { role } = req.query;
  try {
    let query = supabase.from('users').select('id, email, name, role');
    if (role) {
      query = query.eq('role', role);
    }
    const { data: users, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// PUT /api/admin/users/role - Updates a user's role
router.put('/users/role', requireRole('admin'), async (req, res) => {
  const { email, role } = req.body;

  if (!email || !role) {
    return res.status(400).json({ success: false, message: 'Email and role are required.' });
  }

  const allowedRoles = ['admin', 'operations', 'customer', 'department_head', 'department_member'];
  console.log('user role', role);
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role. Must be one of: ${allowedRoles.join(', ')}` });
  }

  try {
    // Check if user exists
    const { data: user, error: findError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (findError || !user) {
      return res.status(404).json({ success: false, message: `User with email ${email} not found.` });
    }

    // Update the user's role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ role: role, updated_at: new Date().toISOString() })
      .eq('email', email)
      .select()
      .single();

    if (updateError) throw updateError;

    res.json({ success: true, message: `User role updated successfully.`, user: updatedUser });
  } catch (error) {
    console.error(`Error updating role for ${email}:`, error);
    res.status(500).json({ success: false, message: 'Failed to update user role', error: error.message });
  }
});

// List all stages as rows, with assigned department head info or null if unassigned
router.get('/department-heads', requireAnyRole(['admin', 'operations']), async (req, res) => {
  try {
    // List of all operational stages
    const ALL_STAGES = [
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
      "Awaiting Payment",
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

// Add a department head
router.post('/department-heads', requireRole('admin'), async (req, res) => {
  const { stage, name, email, phone } = req.body;
  try {
    // Find or create the user
    const { data: user, error: userError } = await supabase.from('users').select('id').eq('email', email).single();
    if (userError || !user) return res.status(400).json({ success: false, error: 'User not found or error.' });
    // Insert into department_heads (no stage)
    const { data: headData, error: headError } = await supabase.from('department_heads').insert([{ id: user.id, name, email, phone }]).select();
    if (headError) return res.status(500).json({ success: false, error: headError.message });
    // Insert stage assignment
    if (stage) {
      const { error: stageError } = await supabase.from('department_head_stages').insert([{ department_head_id: user.id, stage }]);
      if (stageError) return res.status(500).json({ success: false, error: stageError.message });
    }
    // Set user role to department_head
    await supabase.from('users').update({ role: 'department_head' }).eq('email', email);
    res.json({ success: true, department_head: headData[0] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete a department head
router.delete('/department-heads/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('department_heads').delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

// List all department members
router.get('/department-members', requireRole('admin'), async (req, res) => {
  try {
    const { department_head_id } = req.query;
    let query = supabase.from('department_members').select('*');
    if (department_head_id) {
      query = query.eq('department_head_id', department_head_id);
    }
    if (req.user.role === 'department_head') {
      query = query.eq('current_department_head_id', req.user.id);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ success: true, department_members: data });
  } catch (error) {
    console.error('Error fetching department members:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch department members', error: error.message });
  }
});

// Create a department member
router.post('/department-members', requireRole('admin'), async (req, res) => {
  try {
    const { name, email, phone, department_head_id, stage } = req.body;
    if (!name || !email || !department_head_id || !stage) {
      return res.status(400).json({ success: false, message: 'Name, email, department_head_id, and stage are required.' });
    }
    const { data, error } = await supabase.from('department_members').insert([
      { name, email, phone, department_head_id, stage }
    ]).select();
    if (error) throw error;
    // Set user role to department_member
    await supabase.from('users').update({ role: 'department_member' }).eq('email', email);
    res.json({ success: true, department_member: data[0] });
  } catch (error) {
    console.error('Error creating department member:', error);
    res.status(500).json({ success: false, message: 'Failed to create department member', error: error.message });
  }
});

// Update a department member
router.put('/department-members/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, department_head_id, stage } = req.body;
    if (!name || !email || !department_head_id || !stage) {
      return res.status(400).json({ success: false, message: 'Name, email, department_head_id, and stage are required.' });
    }
    const { data, error } = await supabase.from('department_members')
      .update({ name, email, phone, department_head_id, stage, updated_at: new Date() })
      .eq('id', id)
      .select();
    if (error) throw error;
    // Set user role to department_member
    await supabase.from('users').update({ role: 'department_member' }).eq('email', email);
    res.json({ success: true, department_member: data[0] });
  } catch (error) {
    console.error('Error updating department member:', error);
    res.status(500).json({ success: false, message: 'Failed to update department member', error: error.message });
  }
});

// Delete a department member
router.delete('/department-members/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('department_members').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting department member:', error);
    res.status(500).json({ success: false, message: 'Failed to delete department member', error: error.message });
  }
});

// PATCH /orders/:orderId/assign-member
router.patch('/orders/:orderId/assign-member', async (req, res) => {
  const { orderId } = req.params;
  const { memberId } = req.body;
  // Only department head for this order can assign
  const { data: order, error } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();
  if (error || !order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (req.user.id !== order.current_department_head_id) {
    return res.status(403).json({ success: false, message: 'Only department head can assign member.' });
  }
  // Assign member
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

// Get all stages for a department head
router.get('/department-heads/:id/stages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const { data, error } = await db.supabase
      .from('department_head_stages')
      .select('stage')
      .eq('department_head_id', id);
    if (error) throw error;
    res.json(data.map(row => row.stage));
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stages' });
  }
});

// Assign a stage to a department head
router.post('/department-heads/:id/stages', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { stage } = req.body;
  try {
    const { error } = await db.supabase
      .from('department_head_stages')
      .insert([{ department_head_id: id, stage }], { upsert: true });
    if (error) throw error;
    res.status(201).json({ message: 'Stage assigned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign stage' });
  }
});

// Remove a stage from a department head
router.delete('/department-heads/:id/stages/:stage', authenticateToken, async (req, res) => {
  const { id, stage } = req.params;
  try {
    const { error } = await db.supabase
      .from('department_head_stages')
      .delete()
      .eq('department_head_id', id)
      .eq('stage', stage);
    if (error) throw error;
    res.json({ message: 'Stage removed' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove stage' });
  }
});

// Change department head for a specific stage
router.put('/department-heads/stage-assignment', requireRole('admin'), async (req, res) => {
  const { stage, new_department_head_id } = req.body;
  if (!stage || !new_department_head_id) {
    return res.status(400).json({ success: false, message: 'stage and new_department_head_id are required.' });
  }
  try {
    // Remove any existing mapping for that stage
    await db.supabase
      .from('department_head_stages')
      .delete()
      .eq('stage', stage);
    // Ensure the new department head exists in department_heads
    const { data: head, error: headError } = await db.supabase
      .from('department_heads')
      .select('id')
      .eq('id', new_department_head_id)
      .single();
    if (!head) {
      // Get user info from users table
      const { data: user, error: userError } = await db.supabase
        .from('users')
        .select('id, name, email, phone')
        .eq('id', new_department_head_id)
        .single();
      if (!user) {
        return res.status(400).json({ success: false, message: 'User not found for new department head.' });
      }
      // Insert into department_heads
      const { error: insertHeadError } = await db.supabase
        .from('department_heads')
        .insert([{ id: user.id, name: user.name, email: user.email, phone: user.phone }]);
      if (insertHeadError) throw insertHeadError;
    }
    // Insert new mapping
    const { error } = await db.supabase
      .from('department_head_stages')
      .insert([{ department_head_id: new_department_head_id, stage }]);
    if (error) throw error;
    // Optionally, update the user's role to department_head
    await db.supabase
      .from('users')
      .update({ role: 'department_head' })
      .eq('id', new_department_head_id);

    // --- DYNAMIC REASSIGNMENT LOGIC ---
    // 1. Get all department members for this stage
    const { data: members, error: membersError } = await db.supabase
      .from('department_members')
      .select('id')
      .eq('stage', stage);
    if (membersError) throw membersError;
    const memberIds = (members || []).map(m => m.id);
    // 2. Build NOT IN list for SQL
    const notInIds = [new_department_head_id, ...memberIds];
    // 3. Update all orders for this stage where assignee_id is not the new head or a member
    const { data: updatedOrders, error: updateError, count } = await db.supabase
      .from('orders')
      .update({ assignee_id: new_department_head_id })
      .eq('granular_status', stage)
      .not('assignee_id', 'in', `(${notInIds.map(id => `'${id}'`).join(',')})`)
      .select('id', { count: 'exact' });
    if (updateError) throw updateError;
    console.log(`[DEPT HEAD REASSIGN] Updated ${count || (updatedOrders ? updatedOrders.length : 0)} orders for stage '${stage}' to new head ${new_department_head_id}`);
    // --- END DYNAMIC REASSIGNMENT LOGIC ---

    res.json({ success: true, message: 'Department head updated for stage.' });
  } catch (error) {
    console.error('Error updating department head for stage:', error);
    res.status(500).json({ success: false, message: 'Failed to update department head for stage', error: error.message });
  }
});

// Update a department head by id
router.put('/department-heads/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const { data, error } = await db.supabase
      .from('department_heads')
      .update({ name, email, phone, updated_at: new Date() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    // Optionally update user info as well
    await db.supabase.from('users').update({ name, email }).eq('id', id);
    res.json({ success: true, department_head: data });
  } catch (error) {
    console.error('Error updating department head:', error);
    res.status(500).json({ success: false, message: 'Failed to update department head', error: error.message });
  }
});

// POST /api/admin/impersonate - Start impersonation
router.post('/impersonate', requireAnyRole(['admin', 'operations']), async (req, res) => {
  const { targetUserId } = req.body;
  const impersonatorId = req.user.id;

  if (!targetUserId) {
    return res.status(400).json({ success: false, message: 'Target user ID is required.' });
  }

  try {
    // Get target user details
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    // Check impersonation permissions
    const impersonator = req.user;
    if (impersonator.role === 'operations') {
      if (!['customer', 'department_head', 'department_member'].includes(targetUser.role)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Operations users can only impersonate customers and department members.' 
        });
      }
    } else if (impersonator.role === 'admin') {
      if (targetUser.role === 'admin' && impersonator.id !== targetUser.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Admins cannot impersonate other admins for security reasons.' 
        });
      }
    }
    if (impersonator.id === targetUser.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'You cannot impersonate yourself.' 
      });
    }

    // --- JWT GENERATION ---
    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      name: targetUser.name,
      role: targetUser.role,
      impersonator_id: impersonator.id,
      impersonator_role: impersonator.role,
      impersonation: true
    };
    const jwtSecret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;
    const token = jwt.sign(payload, jwtSecret, { expiresIn: '2h' });

    // --- Store impersonation session ---
    const { data: sessionRow, error: sessionError } = await supabase
      .from('impersonation_sessions')
      .insert({
        impersonator_id: impersonator.id,
        target_user_id: targetUser.id,
        session_token: token,
        is_active: true
      })
      .select()
      .single();
    if (sessionError) {
      console.error('Failed to store impersonation session:', sessionError);
    }

    // --- Log the impersonation action ---
    const { error: logError } = await supabase
      .from('audit_log')
      .insert({
        action: 'impersonation_started',
        user_id: impersonator.id,
        target_user_id: targetUser.id,
        details: {
          impersonator_email: impersonator.email,
          impersonator_role: impersonator.role,
          target_email: targetUser.email,
          target_role: targetUser.role,
          timestamp: new Date().toISOString()
        }
      });
    if (logError) {
      console.error('Failed to log impersonation:', logError);
    }

    res.json({
      success: true,
      message: 'Impersonation started successfully.',
      token,
      session: sessionRow,
      targetUser: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        role: targetUser.role
      },
      impersonator: {
        id: impersonator.id,
        email: impersonator.email,
        name: impersonator.name,
        role: impersonator.role
      }
    });
  } catch (error) {
    console.error('Error starting impersonation:', error);
    res.status(500).json({ success: false, message: 'Failed to start impersonation', error: error.message });
  }
});

// POST /api/admin/impersonate/end - End impersonation
router.post('/impersonate/end', requireAnyRole(['admin', 'operations']), async (req, res) => {
  const { targetUserId } = req.body;
  const impersonatorId = req.user.id;

  if (!targetUserId) {
    return res.status(400).json({ success: false, message: 'Target user ID is required.' });
  }

  try {
    // Get target user details for logging
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', targetUserId)
      .single();

    if (targetError || !targetUser) {
      return res.status(404).json({ success: false, message: 'Target user not found.' });
    }

    // Log the end of impersonation
    const { error: logError } = await supabase
      .from('audit_log')
      .insert({
        action: 'impersonation_ended',
        user_id: impersonatorId,
        target_user_id: targetUser.id,
        details: {
          impersonator_email: req.user.email,
          impersonator_role: req.user.role,
          target_email: targetUser.email,
          target_role: targetUser.role,
          timestamp: new Date().toISOString()
        }
      });

    if (logError) {
      console.error('Failed to log impersonation end:', logError);
    }

    res.json({ 
      success: true, 
      message: 'Impersonation ended successfully.' 
    });

  } catch (error) {
    console.error('Error ending impersonation:', error);
    res.status(500).json({ success: false, message: 'Failed to end impersonation', error: error.message });
  }
});

// GET /api/admin/users/impersonatable - Get users that can be impersonated
router.get('/users/impersonatable', requireAnyRole(['admin', 'operations']), async (req, res) => {
  try {
    const impersonator = req.user;
    let allowedRoles = [];

    // Determine which roles the impersonator can impersonate
    if (impersonator.role === 'admin') {
      // Admin can impersonate anyone except other admins
      allowedRoles = ['customer', 'operations', 'department_head', 'department_member'];
    } else if (impersonator.role === 'operations') {
      // Operations can only impersonate customers and department members
      allowedRoles = ['customer', 'department_head', 'department_member'];
    }

    // Get users with allowed roles
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .in('role', allowedRoles)
      .order('name', { ascending: true });

    if (error) throw error;

    // Filter out the impersonator themselves
    const filteredUsers = users.filter(user => user.id !== impersonator.id);

    res.json({ success: true, users: filteredUsers });
  } catch (error) {
    console.error('Error fetching impersonatable users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users', error: error.message });
  }
});

// GET /api/admin/users/me - Return info for the current (possibly impersonated) user
router.get('/users/me', authenticateToken, async (req, res) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch user info', error: error.message });
  }
});

module.exports = router; 