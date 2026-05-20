const express = require('express');
const analyticsService = require('../services/analytics.service');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// All analytics routes require authentication
router.use(authenticate);

/**
 * GET /api/analytics/dashboard
 * Get dashboard analytics summary
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const stats = await analyticsService.getDashboardStats(req.user.userId);
    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/posts/:id
 * Get analytics for a specific post
 */
router.get('/posts/:id', async (req, res, next) => {
  try {
    const data = await analyticsService.getPostAnalytics(req.params.id, req.user.userId);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/analytics/trends
 * Get engagement trends over time
 */
router.get('/trends', async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const data = await analyticsService.getEngagementTrends(req.user.userId, days);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
