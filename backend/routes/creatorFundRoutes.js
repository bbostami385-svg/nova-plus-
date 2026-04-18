import express from 'express';
import { auth } from '../middleware/auth.js';
import CreatorFundService from '../services/CreatorFundService.js';
import AnalyticsService from '../services/AnalyticsService.js';

const router = express.Router();

// ============ CREATOR FUND ROUTES ============

// Initialize creator fund
router.post('/initialize', auth, async (req, res) => {
  try {
    const result = await CreatorFundService.initializeCreatorFund(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get creator fund details
router.get('/details', auth, async (req, res) => {
  try {
    const fund = await CreatorFundService.getCreatorFund(req.user.id);
    res.json(fund);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update payout method
router.put('/payout-method', auth, async (req, res) => {
  try {
    const result = await CreatorFundService.updatePayoutMethod(
      req.user.id,
      req.body.payoutMethod,
      req.body.payoutDetails
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request payout
router.post('/request-payout', auth, async (req, res) => {
  try {
    const result = await CreatorFundService.requestPayout(req.user.id, req.body.amount);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get earnings report
router.get('/earnings-report', auth, async (req, res) => {
  try {
    const report = await CreatorFundService.getEarningsReport(
      req.user.id,
      req.query.period || 'monthly'
    );
    res.json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get creator statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await CreatorFundService.getCreatorStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get top creators
router.get('/top-creators', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const creators = await CreatorFundService.getTopCreators(limit);
    res.json(creators);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ANALYTICS ROUTES ============

// Track view
router.post('/analytics/track-view', async (req, res) => {
  try {
    const analytics = await AnalyticsService.trackView(
      req.body.creatorId,
      req.body.contentId,
      req.body.contentType,
      req.body.viewerData
    );
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track engagement
router.post('/analytics/track-engagement', async (req, res) => {
  try {
    const analytics = await AnalyticsService.trackEngagement(
      req.body.contentId,
      req.body.contentType,
      req.body.engagementType,
      req.body.count
    );
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get content analytics
router.get('/analytics/content/:contentId', async (req, res) => {
  try {
    const analytics = await AnalyticsService.getContentAnalytics(
      req.params.contentId,
      req.query.contentType
    );
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get creator analytics
router.get('/analytics/creator', auth, async (req, res) => {
  try {
    const analytics = await AnalyticsService.getCreatorAnalytics(
      req.user.id,
      req.query.period || 'monthly'
    );
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get audience demographics
router.get('/analytics/demographics', auth, async (req, res) => {
  try {
    const demographics = await AnalyticsService.getAudienceDemographics(req.user.id);
    res.json(demographics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get trending content
router.get('/analytics/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const trending = await AnalyticsService.getTrendingContent(limit);
    res.json(trending);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Generate performance report
router.post('/analytics/performance-report', auth, async (req, res) => {
  try {
    const report = await AnalyticsService.generatePerformanceReport(
      req.user.id,
      new Date(req.body.startDate),
      new Date(req.body.endDate)
    );
    res.json(report);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Track revenue
router.post('/analytics/track-revenue', async (req, res) => {
  try {
    const analytics = await AnalyticsService.trackRevenue(
      req.body.contentId,
      req.body.contentType,
      req.body.revenueData
    );
    res.json(analytics);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
