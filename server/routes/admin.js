const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole, requireAnyRole } = require('../middleware/auth');
const db = require('../utils/db');

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
router.get('/department-heads/:id/stages', async (req, res) => {
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
router.post('/department-heads/:id/stages', async (req, res) => {
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
router.delete('/department-heads/:id/stages/:stage', async (req, res) => {
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

module.exports = router; 