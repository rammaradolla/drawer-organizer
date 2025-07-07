const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanupOrphanedDepartmentHeads() {
  // Fetch all users
  const { data: users, error: usersError } = await supabase.from('users').select('id');
  if (usersError) {
    console.error('Error fetching users:', usersError.message);
    process.exit(1);
  }
  const userIds = new Set(users.map(u => u.id));

  // Fetch all department heads
  const { data: heads, error: headsError } = await supabase.from('department_heads').select('id, name, email, phone');
  if (headsError) {
    console.error('Error fetching department heads:', headsError.message);
    process.exit(1);
  }

  // Find orphaned department heads (not in users)
  const orphanedHeads = heads.filter(head => !userIds.has(head.id));
  if (orphanedHeads.length === 0) {
    console.log('No orphaned department heads found.');
    process.exit(0);
  }

  const orphanedIds = orphanedHeads.map(h => h.id);
  const { error: deleteError } = await supabase.from('department_heads').delete().in('id', orphanedIds);
  if (deleteError) {
    console.error('Error deleting orphaned department heads:', deleteError.message);
    process.exit(1);
  }

  console.log(`Deleted ${orphanedIds.length} orphaned department head(s):`, orphanedIds);
  process.exit(0);
}

cleanupOrphanedDepartmentHeads(); 