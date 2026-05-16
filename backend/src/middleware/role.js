'use strict';

/**
 * Role guard middleware factory.
 * @param {...string} allowedRoles - Roles permitted to access the route.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Authentication required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of: [${allowedRoles.join(', ')}].`,
      });
    }
    return next();
  };
};

module.exports = { requireRole };
