const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { authenticateToken, requireRole } = require('../middleware/auth');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Protect all routes in this file, only admins can access
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/users - Fetches users, can filter by role
router.get('/users', async (req, res) => {
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
router.put('/users/role', async (req, res) => {
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

module.exports = router; 