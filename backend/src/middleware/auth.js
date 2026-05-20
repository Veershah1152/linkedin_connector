const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * JWT Authentication Middleware
 * Extracts and verifies JWT from Authorization header or cookies
 */
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in.',
      });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please refresh your session.',
      });
    }
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token.',
    });
  }
};

/**
 * Optional authentication — doesn't fail if no token present
 */
const optionalAuth = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7)
      : req.cookies?.accessToken;

    if (token) {
      const decoded = jwt.verify(token, config.jwt.secret);
      req.user = decoded;
    }
  } catch {
    // Silently continue without auth
  }
  next();
};

/**
 * Plan-based authorization middleware
 */
const requirePlan = (...plans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
      });
    }

    if (!plans.includes(req.user.plan)) {
      return res.status(403).json({
        success: false,
        error: `This feature requires a ${plans.join(' or ')} plan.`,
      });
    }

    next();
  };
};

module.exports = { authenticate, optionalAuth, requirePlan };
