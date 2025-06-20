const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Helper function to format order data for API responses
const formatOrder = (order) => {
  if (!order) return null;
  
  return {
    id: order.id,
    user_id: order.user_id,
    cart_json: order.cart_json,
    total_price: order.total_price,
    status: order.status,
    tracking_number: order.tracking_number,
    tracking_carrier: order.tracking_carrier,
    notes: order.notes,
    blocker_reason: order.blocker_reason,
    stripe_checkout_id: order.stripe_checkout_id,
    created_at: order.created_at,
    last_updated_at: order.last_updated_at,
    last_updated_by: order.last_updated_by,
    user: order.users ? {
      id: order.users.id,
      email: order.users.email,
      name: order.users.name
    } : null
  };
};

// Helper function to validate order status
const isValidOrderStatus = (status) => {
  const validStatuses = ['pending', 'in_progress', 'fulfilled', 'blocked', 'cancelled'];
  return validStatuses.includes(status);
};

// Helper function to get status badge color
const getStatusColor = (status) => {
  const colors = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    fulfilled: 'bg-green-100 text-green-800',
    blocked: 'bg-red-100 text-red-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Helper function to format currency
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount);
};

// Helper function to calculate order summary
const calculateOrderSummary = (cartJson) => {
  if (!cartJson || !Array.isArray(cartJson)) return { itemCount: 0, totalItems: 0 };
  
  const itemCount = cartJson.length;
  const totalItems = cartJson.reduce((sum, item) => sum + (item.quantity || 1), 0);
  
  return { itemCount, totalItems };
};

// Helper function to build search query
const buildSearchQuery = (query, searchTerm) => {
  if (!searchTerm) return query;
  
  return query.or(`
    users.email.ilike.%${searchTerm}%,
    id.ilike.%${searchTerm}%,
    tracking_number.ilike.%${searchTerm}%,
    users.name.ilike.%${searchTerm}%
  `);
};

// Helper function to build status filter
const buildStatusFilter = (query, status) => {
  if (!status || status === 'all') return query;
  return query.eq('status', status);
};

// Helper function to build date range filter
const buildDateRangeFilter = (query, startDate, endDate) => {
  if (startDate) {
    query = query.gte('created_at', startDate);
  }
  if (endDate) {
    query = query.lte('created_at', endDate);
  }
  return query;
};

// Helper function to create audit log entry
const createAuditLogEntry = async (orderId, action, oldValues, newValues, updatedBy, notes) => {
  try {
    const { error } = await supabase
      .from('order_audit_log')
      .insert({
        order_id: orderId,
        action,
        old_values: JSON.stringify(oldValues),
        new_values: JSON.stringify(newValues),
        updated_by: updatedBy,
        notes
      });

    if (error) {
      console.error('Error creating audit log entry:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    // Don't throw here - audit logging failure shouldn't break the main operation
  }
};

// Helper function to get user by ID
const getUserById = async (userId) => {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

// Helper function to validate tracking number format
const validateTrackingNumber = (trackingNumber, carrier) => {
  if (!trackingNumber) return true; // Empty is valid
  
  const patterns = {
    'usps': /^[0-9]{20}$|^[A-Z]{2}[0-9]{9}[A-Z]{2}$/,
    'ups': /^1Z[0-9A-Z]{16}$/,
    'fedex': /^[0-9]{12}$|^[0-9]{15}$/,
    'dhl': /^[0-9]{10}$|^[0-9]{12}$/
  };
  
  if (carrier && patterns[carrier.toLowerCase()]) {
    return patterns[carrier.toLowerCase()].test(trackingNumber);
  }
  
  // If no specific carrier pattern, just check it's not empty
  return trackingNumber.length > 0;
};

module.exports = {
  supabase,
  formatOrder,
  isValidOrderStatus,
  getStatusColor,
  formatCurrency,
  calculateOrderSummary,
  buildSearchQuery,
  buildStatusFilter,
  buildDateRangeFilter,
  createAuditLogEntry,
  getUserById,
  validateTrackingNumber
}; 