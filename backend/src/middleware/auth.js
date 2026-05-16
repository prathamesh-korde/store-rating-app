'use strict';
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Middleware: verify JWT from httpOnly cookie or Authorization header.
 * Attaches decoded payload to req.user.
 */
const authenticate = (req, res, next) => {
  try {
    // Prefer cookie, fall back to Bearer token
    let token = req.cookies?.token;
    if (!token) {
      const authHeader = req.headers.authorization || '';
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return res.status(401).json({ success: false, error: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    return next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: 'Session expired. Please log in again.' });
    }
    return res.status(401).json({ success: false, error: 'Invalid token. Please log in again.' });
  }
};

module.exports = { authenticate };
