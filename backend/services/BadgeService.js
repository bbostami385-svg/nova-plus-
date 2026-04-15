import Badge from '../models/Badge.js';
import User from '../models/User.js';

class BadgeService {
  // Get all badges
  static async getAllBadges() {
    try {
      const badges = await Badge.find().sort({ createdAt: -1 });
      return badges;
    } catch (error) {
      throw new Error(`Failed to get badges: ${error.message}`);
    }
  }

  // Get user badges
  static async getUserBadges(userId) {
    try {
      const user = await User.findById(userId).populate('badges');
      if (!user) throw new Error('User not found');
      return user.badges || [];
    } catch (error) {
      throw new Error(`Failed to get user badges: ${error.message}`);
    }
  }

  // Award badge to user
  static async awardBadge(userId, badgeId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const badge = await Badge.findById(badgeId);
      if (!badge) throw new Error('Badge not found');

      // Check if user already has this badge
      if (user.badges.includes(badgeId)) {
        return { success: false, message: 'User already has this badge' };
      }

      user.badges.push(badgeId);
      await user.save();

      return {
        success: true,
        message: 'Badge awarded successfully',
        badge,
      };
    } catch (error) {
      throw new Error(`Failed to award badge: ${error.message}`);
    }
  }

  // Check and award badges based on user activity
  static async checkAndAwardBadges(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const awardedBadges = [];

      // Verified User Badge
      if (user.isVerified && !user.badges.some(b => b.code === 'VERIFIED')) {
        const verifiedBadge = await Badge.findOne({ code: 'VERIFIED' });
        if (verifiedBadge && !user.badges.includes(verifiedBadge._id)) {
          user.badges.push(verifiedBadge._id);
          awardedBadges.push(verifiedBadge);
        }
      }

      // Early Adopter Badge
      const accountAge = Date.now() - user.createdAt.getTime();
      const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
      if (accountAge < thirtyDaysInMs && !user.badges.some(b => b.code === 'EARLY_ADOPTER')) {
        const earlyAdopterBadge = await Badge.findOne({ code: 'EARLY_ADOPTER' });
        if (earlyAdopterBadge && !user.badges.includes(earlyAdopterBadge._id)) {
          user.badges.push(earlyAdopterBadge._id);
          awardedBadges.push(earlyAdopterBadge);
        }
      }

      // Active User Badge
      const lastActiveDate = user.lastSignedIn;
      const oneDayInMs = 24 * 60 * 60 * 1000;
      if (Date.now() - lastActiveDate.getTime() < oneDayInMs && !user.badges.some(b => b.code === 'ACTIVE')) {
        const activeBadge = await Badge.findOne({ code: 'ACTIVE' });
        if (activeBadge && !user.badges.includes(activeBadge._id)) {
          user.badges.push(activeBadge._id);
          awardedBadges.push(activeBadge);
        }
      }

      if (awardedBadges.length > 0) {
        await user.save();
      }

      return awardedBadges;
    } catch (error) {
      throw new Error(`Failed to check and award badges: ${error.message}`);
    }
  }

  // Get badge categories
  static async getBadgeCategories() {
    try {
      const categories = [
        { id: 'achievement', name: 'Achievement', icon: '🏆' },
        { id: 'social', name: 'Social', icon: '👥' },
        { id: 'creator', name: 'Creator', icon: '🎨' },
        { id: 'engagement', name: 'Engagement', icon: '💬' },
        { id: 'special', name: 'Special', icon: '✨' },
      ];

      return categories;
    } catch (error) {
      throw new Error(`Failed to get badge categories: ${error.message}`);
    }
  }

  // Get badges by category
  static async getBadgesByCategory(category) {
    try {
      const badges = await Badge.find({ category }).sort({ createdAt: -1 });
      return badges;
    } catch (error) {
      throw new Error(`Failed to get badges by category: ${error.message}`);
    }
  }

  // Initialize default badges
  static async initializeDefaultBadges() {
    try {
      const defaultBadges = [
        {
          code: 'VERIFIED',
          name: 'Verified',
          description: 'Verified user account',
          icon: '✅',
          category: 'special',
          rarity: 'rare',
        },
        {
          code: 'EARLY_ADOPTER',
          name: 'Early Adopter',
          description: 'Joined in the first month',
          icon: '🚀',
          category: 'special',
          rarity: 'epic',
        },
        {
          code: 'ACTIVE',
          name: 'Active',
          description: 'Logged in today',
          icon: '⚡',
          category: 'engagement',
          rarity: 'common',
        },
        {
          code: 'CONTENT_CREATOR',
          name: 'Content Creator',
          description: 'Created 50+ posts',
          icon: '🎬',
          category: 'creator',
          rarity: 'rare',
        },
        {
          code: 'SOCIAL_BUTTERFLY',
          name: 'Social Butterfly',
          description: 'Followed 100+ users',
          icon: '🦋',
          category: 'social',
          rarity: 'rare',
        },
        {
          code: 'ENGAGEMENT_MASTER',
          name: 'Engagement Master',
          description: 'Received 1000+ likes',
          icon: '💖',
          category: 'engagement',
          rarity: 'epic',
        },
        {
          code: 'TRENDING',
          name: 'Trending',
          description: 'Had a post go viral',
          icon: '📈',
          category: 'achievement',
          rarity: 'legendary',
        },
        {
          code: 'HELPFUL',
          name: 'Helpful',
          description: 'Received helpful votes',
          icon: '🤝',
          category: 'social',
          rarity: 'uncommon',
        },
      ];

      for (const badge of defaultBadges) {
        const exists = await Badge.findOne({ code: badge.code });
        if (!exists) {
          await Badge.create(badge);
        }
      }

      return { success: true, message: 'Default badges initialized' };
    } catch (error) {
      throw new Error(`Failed to initialize badges: ${error.message}`);
    }
  }

  // Get badge rarity levels
  static async getBadgeRarities() {
    try {
      const rarities = [
        { id: 'common', name: 'Common', color: '#808080', percentage: 50 },
        { id: 'uncommon', name: 'Uncommon', color: '#00FF00', percentage: 30 },
        { id: 'rare', name: 'Rare', color: '#0070DD', percentage: 15 },
        { id: 'epic', name: 'Epic', color: '#A335EE', percentage: 4 },
        { id: 'legendary', name: 'Legendary', color: '#FF8000', percentage: 1 },
      ];

      return rarities;
    } catch (error) {
      throw new Error(`Failed to get badge rarities: ${error.message}`);
    }
  }

  // Get user badge collection progress
  static async getUserBadgeProgress(userId) {
    try {
      const user = await User.findById(userId).populate('badges');
      if (!user) throw new Error('User not found');

      const allBadges = await Badge.find();
      const userBadges = user.badges || [];
      const userBadgeIds = userBadges.map(b => b._id.toString());

      const progress = {
        total: allBadges.length,
        collected: userBadges.length,
        percentage: (userBadges.length / allBadges.length) * 100,
        byCategory: {},
      };

      // Group by category
      for (const badge of allBadges) {
        if (!progress.byCategory[badge.category]) {
          progress.byCategory[badge.category] = {
            total: 0,
            collected: 0,
          };
        }
        progress.byCategory[badge.category].total += 1;

        if (userBadgeIds.includes(badge._id.toString())) {
          progress.byCategory[badge.category].collected += 1;
        }
      }

      return progress;
    } catch (error) {
      throw new Error(`Failed to get badge progress: ${error.message}`);
    }
  }
}

export default BadgeService;
