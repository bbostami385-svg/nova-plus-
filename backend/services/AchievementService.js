import Achievement from '../models/Achievement.js';
import Badge from '../models/Badge.js';
import User from '../models/User.js';

class AchievementService {
  // Get all achievements
  static async getAllAchievements() {
    try {
      const achievements = await Achievement.find().sort({ createdAt: -1 });
      return achievements;
    } catch (error) {
      throw new Error(`Failed to get achievements: ${error.message}`);
    }
  }

  // Get user achievements
  static async getUserAchievements(userId) {
    try {
      const user = await User.findById(userId).populate('achievements');
      if (!user) throw new Error('User not found');
      return user.achievements || [];
    } catch (error) {
      throw new Error(`Failed to get user achievements: ${error.message}`);
    }
  }

  // Award achievement to user
  static async awardAchievement(userId, achievementId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const achievement = await Achievement.findById(achievementId);
      if (!achievement) throw new Error('Achievement not found');

      // Check if user already has this achievement
      if (user.achievements.includes(achievementId)) {
        return { success: false, message: 'User already has this achievement' };
      }

      user.achievements.push(achievementId);
      user.points = (user.points || 0) + achievement.points;
      await user.save();

      return {
        success: true,
        message: 'Achievement awarded successfully',
        achievement,
        totalPoints: user.points,
      };
    } catch (error) {
      throw new Error(`Failed to award achievement: ${error.message}`);
    }
  }

  // Check and award achievements based on user activity
  static async checkAndAwardAchievements(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const awardedAchievements = [];

      // First Post Achievement
      const postCount = user.posts?.length || 0;
      if (postCount === 1) {
        const firstPostAchievement = await Achievement.findOne({ code: 'FIRST_POST' });
        if (firstPostAchievement && !user.achievements.includes(firstPostAchievement._id)) {
          user.achievements.push(firstPostAchievement._id);
          awardedAchievements.push(firstPostAchievement);
        }
      }

      // 10 Posts Achievement
      if (postCount === 10) {
        const tenPostsAchievement = await Achievement.findOne({ code: 'TEN_POSTS' });
        if (tenPostsAchievement && !user.achievements.includes(tenPostsAchievement._id)) {
          user.achievements.push(tenPostsAchievement._id);
          awardedAchievements.push(tenPostsAchievement);
        }
      }

      // 100 Posts Achievement
      if (postCount === 100) {
        const hundredPostsAchievement = await Achievement.findOne({ code: 'HUNDRED_POSTS' });
        if (hundredPostsAchievement && !user.achievements.includes(hundredPostsAchievement._id)) {
          user.achievements.push(hundredPostsAchievement._id);
          awardedAchievements.push(hundredPostsAchievement);
        }
      }

      // First Follower Achievement
      const followerCount = user.followers?.length || 0;
      if (followerCount === 1) {
        const firstFollowerAchievement = await Achievement.findOne({ code: 'FIRST_FOLLOWER' });
        if (firstFollowerAchievement && !user.achievements.includes(firstFollowerAchievement._id)) {
          user.achievements.push(firstFollowerAchievement._id);
          awardedAchievements.push(firstFollowerAchievement);
        }
      }

      // 100 Followers Achievement
      if (followerCount === 100) {
        const hundredFollowersAchievement = await Achievement.findOne({ code: 'HUNDRED_FOLLOWERS' });
        if (hundredFollowersAchievement && !user.achievements.includes(hundredFollowersAchievement._id)) {
          user.achievements.push(hundredFollowersAchievement._id);
          awardedAchievements.push(hundredFollowersAchievement);
        }
      }

      // 1000 Followers Achievement
      if (followerCount === 1000) {
        const thousandFollowersAchievement = await Achievement.findOne({ code: 'THOUSAND_FOLLOWERS' });
        if (thousandFollowersAchievement && !user.achievements.includes(thousandFollowersAchievement._id)) {
          user.achievements.push(thousandFollowersAchievement._id);
          awardedAchievements.push(thousandFollowersAchievement);
        }
      }

      if (awardedAchievements.length > 0) {
        await user.save();
      }

      return awardedAchievements;
    } catch (error) {
      throw new Error(`Failed to check and award achievements: ${error.message}`);
    }
  }

  // Get leaderboard
  static async getLeaderboard(limit = 100) {
    try {
      const leaderboard = await User.find()
        .select('username profilePicture points achievements followers')
        .sort({ points: -1 })
        .limit(limit)
        .populate('achievements', 'name icon points');

      return leaderboard;
    } catch (error) {
      throw new Error(`Failed to get leaderboard: ${error.message}`);
    }
  }

  // Get user rank
  static async getUserRank(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const rank = await User.countDocuments({ points: { $gt: user.points } });
      return rank + 1;
    } catch (error) {
      throw new Error(`Failed to get user rank: ${error.message}`);
    }
  }

  // Get user level based on points
  static async getUserLevel(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      const points = user.points || 0;
      let level = 1;

      if (points >= 10000) level = 10;
      else if (points >= 8000) level = 9;
      else if (points >= 6000) level = 8;
      else if (points >= 4000) level = 7;
      else if (points >= 2000) level = 6;
      else if (points >= 1000) level = 5;
      else if (points >= 500) level = 4;
      else if (points >= 100) level = 3;
      else if (points >= 50) level = 2;

      const nextLevelPoints = this.getPointsForLevel(level + 1);
      const currentLevelPoints = this.getPointsForLevel(level);
      const progressPercentage = ((points - currentLevelPoints) / (nextLevelPoints - currentLevelPoints)) * 100;

      return {
        level,
        points,
        nextLevelPoints,
        progressPercentage: Math.min(progressPercentage, 100),
      };
    } catch (error) {
      throw new Error(`Failed to get user level: ${error.message}`);
    }
  }

  // Get points required for a level
  static getPointsForLevel(level) {
    const levelPoints = {
      1: 0,
      2: 50,
      3: 100,
      4: 500,
      5: 1000,
      6: 2000,
      7: 4000,
      8: 6000,
      9: 8000,
      10: 10000,
    };
    return levelPoints[level] || 0;
  }

  // Award daily challenge
  static async awardDailyChallenge(userId, challengeId) {
    try {
      const user = await User.findById(userId);
      if (!user) throw new Error('User not found');

      // Check if user already completed today's challenge
      const today = new Date().toDateString();
      if (user.dailyChallengeCompletedDate === today) {
        return { success: false, message: 'Daily challenge already completed today' };
      }

      user.points = (user.points || 0) + 100;
      user.dailyChallengeCompletedDate = today;
      user.dailyChallengeStreak = (user.dailyChallengeStreak || 0) + 1;
      await user.save();

      return {
        success: true,
        message: 'Daily challenge completed',
        pointsAwarded: 100,
        streak: user.dailyChallengeStreak,
      };
    } catch (error) {
      throw new Error(`Failed to award daily challenge: ${error.message}`);
    }
  }

  // Get daily challenges
  static async getDailyChallenges() {
    try {
      const challenges = [
        {
          id: 'daily_1',
          title: 'Post Something',
          description: 'Create and share a post',
          points: 100,
          icon: '📝',
        },
        {
          id: 'daily_2',
          title: 'Like 5 Posts',
          description: 'Like 5 posts from other users',
          points: 50,
          icon: '❤️',
        },
        {
          id: 'daily_3',
          title: 'Comment 3 Times',
          description: 'Leave 3 comments on posts',
          points: 75,
          icon: '💬',
        },
        {
          id: 'daily_4',
          title: 'Follow Someone',
          description: 'Follow a new user',
          points: 50,
          icon: '👥',
        },
        {
          id: 'daily_5',
          title: 'Share a Post',
          description: 'Share a post to your followers',
          points: 100,
          icon: '🔄',
        },
      ];

      return challenges;
    } catch (error) {
      throw new Error(`Failed to get daily challenges: ${error.message}`);
    }
  }

  // Initialize default achievements
  static async initializeDefaultAchievements() {
    try {
      const defaultAchievements = [
        {
          code: 'FIRST_POST',
          name: 'First Post',
          description: 'Create your first post',
          icon: '📝',
          points: 50,
        },
        {
          code: 'TEN_POSTS',
          name: 'Getting Started',
          description: 'Create 10 posts',
          icon: '📚',
          points: 200,
        },
        {
          code: 'HUNDRED_POSTS',
          name: 'Content Creator',
          description: 'Create 100 posts',
          icon: '🎬',
          points: 500,
        },
        {
          code: 'FIRST_FOLLOWER',
          name: 'Popular',
          description: 'Get your first follower',
          icon: '👤',
          points: 100,
        },
        {
          code: 'HUNDRED_FOLLOWERS',
          name: 'Influencer',
          description: 'Get 100 followers',
          icon: '⭐',
          points: 500,
        },
        {
          code: 'THOUSAND_FOLLOWERS',
          name: 'Celebrity',
          description: 'Get 1000 followers',
          icon: '🌟',
          points: 1000,
        },
      ];

      for (const achievement of defaultAchievements) {
        const exists = await Achievement.findOne({ code: achievement.code });
        if (!exists) {
          await Achievement.create(achievement);
        }
      }

      return { success: true, message: 'Default achievements initialized' };
    } catch (error) {
      throw new Error(`Failed to initialize achievements: ${error.message}`);
    }
  }
}

export default AchievementService;
