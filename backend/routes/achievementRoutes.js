import express from 'express';
import AchievementService from '../services/AchievementService.js';
import BadgeService from '../services/BadgeService.js';
import { verifyFirebaseAuth, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// ==================== ACHIEVEMENTS ====================

// Get all achievements
router.get('/achievements', async (req, res) => {
  try {
    const achievements = await AchievementService.getAllAchievements();
    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user achievements
router.get('/achievements/user/:userId', async (req, res) => {
  try {
    const achievements = await AchievementService.getUserAchievements(req.params.userId);
    res.status(200).json({
      success: true,
      data: achievements,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Award achievement
router.post('/achievements/award', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { achievementId } = req.body;
    if (!achievementId) {
      return res.status(400).json({
        success: false,
        message: 'Achievement ID is required',
      });
    }

    const result = await AchievementService.awardAchievement(req.user._id, achievementId);
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const limit = req.query.limit || 100;
    const leaderboard = await AchievementService.getLeaderboard(limit);
    res.status(200).json({
      success: true,
      data: leaderboard,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user rank
router.get('/rank/:userId', async (req, res) => {
  try {
    const rank = await AchievementService.getUserRank(req.params.userId);
    res.status(200).json({
      success: true,
      data: { rank },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user level
router.get('/level/:userId', async (req, res) => {
  try {
    const level = await AchievementService.getUserLevel(req.params.userId);
    res.status(200).json({
      success: true,
      data: level,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get daily challenges
router.get('/daily-challenges', async (req, res) => {
  try {
    const challenges = await AchievementService.getDailyChallenges();
    res.status(200).json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Complete daily challenge
router.post('/daily-challenges/:challengeId', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const result = await AchievementService.awardDailyChallenge(req.user._id, req.params.challengeId);
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Initialize default achievements
router.post('/initialize-achievements', async (req, res) => {
  try {
    const result = await AchievementService.initializeDefaultAchievements();
    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// ==================== BADGES ====================

// Get all badges
router.get('/badges', async (req, res) => {
  try {
    const badges = await BadgeService.getAllBadges();
    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user badges
router.get('/badges/user/:userId', async (req, res) => {
  try {
    const badges = await BadgeService.getUserBadges(req.params.userId);
    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Award badge
router.post('/badges/award', verifyFirebaseAuth, isAuthenticated, async (req, res) => {
  try {
    const { badgeId } = req.body;
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        message: 'Badge ID is required',
      });
    }

    const result = await BadgeService.awardBadge(req.user._id, badgeId);
    res.status(200).json({
      success: result.success,
      message: result.message,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get badge categories
router.get('/badges/categories', async (req, res) => {
  try {
    const categories = await BadgeService.getBadgeCategories();
    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get badges by category
router.get('/badges/category/:category', async (req, res) => {
  try {
    const badges = await BadgeService.getBadgesByCategory(req.params.category);
    res.status(200).json({
      success: true,
      data: badges,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get badge rarities
router.get('/badges/rarities', async (req, res) => {
  try {
    const rarities = await BadgeService.getBadgeRarities();
    res.status(200).json({
      success: true,
      data: rarities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Get user badge progress
router.get('/badges/progress/:userId', async (req, res) => {
  try {
    const progress = await BadgeService.getUserBadgeProgress(req.params.userId);
    res.status(200).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Initialize default badges
router.post('/initialize-badges', async (req, res) => {
  try {
    const result = await BadgeService.initializeDefaultBadges();
    res.status(200).json({
      success: result.success,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
