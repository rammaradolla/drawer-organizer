const express = require('express');
const router = express.Router();
const emailService = require('../services/emailService');
const { supabase } = require('../utils/db');

// Test email route (remove in production)
router.get('/test-email', async (req, res) => {
  try {
    const testEmail = req.query.email || 'test@example.com';
    const result = await emailService.sendTestEmail(testEmail);
    
    res.json({
      success: result,
      message: result ? 'Test email sent successfully!' : 'Failed to send test email',
      testEmail
    });
  } catch (error) {
    console.error('Test email error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending test email',
      error: error.message
    });
  }
});

// Audit log verification route
router.get('/audit-log-verification', async (req, res) => {
  try {
    console.log('🔍 Verifying Audit Log Setup...');

    const verificationResults = {
      tables: {},
      counts: {},
      sampleEntries: [],
      environment: {},
      summary: {}
    };

    // 1. Check if order_audit_log table exists
    console.log('1. Checking if order_audit_log table exists...');
    const { data: auditLogData, error: auditLogError } = await supabase
      .from('order_audit_log')
      .select('*')
      .limit(1);

    if (auditLogError) {
      verificationResults.tables.order_audit_log = {
        exists: false,
        error: auditLogError.message
      };
    } else {
      verificationResults.tables.order_audit_log = {
        exists: true,
        accessible: true
      };
    }

    // 2. Check if orders table exists
    console.log('2. Checking if orders table exists...');
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);

    if (ordersError) {
      verificationResults.tables.orders = {
        exists: false,
        error: ordersError.message
      };
    } else {
      verificationResults.tables.orders = {
        exists: true,
        accessible: true
      };
    }

    // 3. Check if users table exists
    console.log('3. Checking if users table exists...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (usersError) {
      verificationResults.tables.users = {
        exists: false,
        error: usersError.message
      };
    } else {
      verificationResults.tables.users = {
        exists: true,
        accessible: true
      };
    }

    // 4. Count existing audit log entries
    console.log('4. Counting existing audit log entries...');
    const { count: auditLogCount, error: countError } = await supabase
      .from('order_audit_log')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      verificationResults.counts.auditLog = {
        count: 0,
        error: countError.message
      };
    } else {
      verificationResults.counts.auditLog = {
        count: auditLogCount
      };
    }

    // 5. Count existing orders
    console.log('5. Counting existing orders...');
    const { count: ordersCount, error: ordersCountError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (ordersCountError) {
      verificationResults.counts.orders = {
        count: 0,
        error: ordersCountError.message
      };
    } else {
      verificationResults.counts.orders = {
        count: ordersCount
      };
    }

    // 6. Show sample audit log entries if any exist
    if (auditLogCount > 0) {
      console.log('6. Sample audit log entries:');
      const { data: sampleEntries, error: sampleError } = await supabase
        .from('order_audit_log')
        .select(`
          *,
          users!order_audit_log_updated_by_fkey (
            id,
            email,
            name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      if (sampleError) {
        verificationResults.sampleEntries = {
          error: sampleError.message
        };
      } else {
        verificationResults.sampleEntries = sampleEntries.map(entry => ({
          id: entry.id,
          action: entry.action,
          notes: entry.notes,
          user: entry.users?.email || entry.updated_by,
          created_at: entry.created_at,
          old_values: entry.old_values,
          new_values: entry.new_values
        }));
      }
    }

    // 7. Check environment variables
    console.log('7. Checking environment variables...');
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_SERVICE_ROLE_KEY',
      'STRIPE_SECRET_KEY'
    ];

    requiredEnvVars.forEach(varName => {
      verificationResults.environment[varName] = {
        set: !!process.env[varName],
        value: process.env[varName] ? '***' + process.env[varName].slice(-4) : null
      };
    });

    // 8. Summary
    console.log('8. Generating summary...');
    const allTablesExist = Object.values(verificationResults.tables).every(table => table.exists);
    const allEnvVarsSet = Object.values(verificationResults.environment).every(env => env.set);

    verificationResults.summary = {
      allTablesExist,
      allEnvVarsSet,
      auditLogCount: verificationResults.counts.auditLog?.count || 0,
      ordersCount: verificationResults.counts.orders?.count || 0,
      readyForTesting: allTablesExist && allEnvVarsSet
    };

    console.log('✅ Audit log verification complete!');

    res.json({
      success: true,
      message: 'Audit log verification completed',
      results: verificationResults
    });

  } catch (error) {
    console.error('❌ Error during audit log verification:', error);
    res.status(500).json({
      success: false,
      message: 'Error during audit log verification',
      error: error.message
    });
  }
});

// TEMP: List all department heads and their stages
router.get('/department-heads-list', async (req, res) => {
  try {
    const { data, error } = await require('../utils/db').supabase
      .from('department_heads')
      .select('stage, id');
    if (error) throw error;
    res.json({ success: true, department_heads: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 