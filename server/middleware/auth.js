const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Middleware to verify JWT and attach user info
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    // Verify JWT with Supabase JWT secret
    const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

    // Always use the sub claim as the user ID (for impersonation tokens)
    const userId = decoded.sub;
    // Get user details from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, name, role')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not found' 
      });
    }

    // Attach user info to request
    req.user = user;
    // Attach impersonator info if present
    if (decoded.impersonator_id) {
      req.impersonator = {
        id: decoded.impersonator_id,
        role: decoded.impersonator_role
      };
      req.user.isImpersonating = true;
      req.user.impersonator = req.impersonator;
    }
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
};

// Middleware to check if user has required role
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. ${requiredRole} role required.` 
      });
    }

    next();
  };
};

// Middleware to check if user has any of the required roles
const requireAnyRole = (requiredRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    if (!requiredRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Access denied. One of these roles required: ${requiredRoles.join(', ')}` 
      });
    }

    next();
  };
};

// Middleware to check if user is a department head
const requireDepartmentHead = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'department_head') {
    return res.status(403).json({ success: false, message: 'Access denied. department_head role required.' });
  }
  next();
};

// Middleware to check if user is a department member
const requireDepartmentMember = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'department_member') {
    return res.status(403).json({ success: false, message: 'Access denied. department_member role required.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAnyRole,
  requireDepartmentHead,
  requireDepartmentMember
}; 