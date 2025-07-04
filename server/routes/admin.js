const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole, requireAnyRole } = require('../middleware/auth');

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

  const allowedRoles = ['admin', 'operations', 'customer'];
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

// List all department heads
router.get('/department-heads', requireAnyRole(['admin', 'operations']), async (req, res) => {
  const { data, error } = await supabase.from('department_heads').select('*');
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, department_heads: data });
});

// Add a department head
router.post('/department-heads', requireRole('admin'), async (req, res) => {
  const { stage, name, email, phone } = req.body;
  const { data, error } = await supabase.from('department_heads').insert([{ stage, name, email, phone }]).select();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, department_head: data[0] });
});

// Update a department head
router.put('/department-heads/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { stage, name, email, phone } = req.body;
  const { data, error } = await supabase.from('department_heads').update({ stage, name, email, phone, updated_at: new Date() }).eq('id', id).select();
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true, department_head: data[0] });
});

// Delete a department head
router.delete('/department-heads/:id', requireRole('admin'), async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase.from('department_heads').delete().eq('id', id);
  if (error) return res.status(500).json({ success: false, error: error.message });
  res.json({ success: true });
});

module.exports = router; 