import VIPAccount from '../models/VIPAccount.js';
import SubscriptionTier from '../models/SubscriptionTier.js';
import AuditLog from '../models/AuditLog.js';
import NotificationService from './NotificationService.js';

class VIPService {
  // Create VIP Account
  static async createVIPAccount(userId, vipTier, duration, paymentMethod, amount) {
    try {
      const tier = await SubscriptionTier.findById(vipTier);
      if (!tier) {
        throw new Error('VIP tier not found');
      }

      const durationInDays = this.getDurationInDays(duration);
      const endDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

      const vipAccount = new VIPAccount({
        userId,
        vipTier: tier.tierName.toLowerCase(),
        tierLevel: tier.tierLevel,
        subscriptionStatus: 'active',
        subscriptionStartDate: new Date(),
        subscriptionEndDate: endDate,
        subscriptionDuration: duration,
        paymentMethod,
        paymentStatus: 'completed',
        amount,
        autoRenewal: true,
      });

      // Enable features based on tier
      this.enableTierFeatures(vipAccount, tier.tierName);

      await vipAccount.save();

      await NotificationService.sendNotification(userId, {
        title: '🌟 Welcome to VIP!',
        message: `You're now a VIP ${tier.tierName} member!`,
        type: 'vip_activated',
      });

      await AuditLog.logActivity({
        userId,
        action: 'vip_account_created',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `VIP account created: ${tier.tierName}`,
        performedBy: { userType: 'system' },
      });

      return vipAccount;
    } catch (error) {
      throw error;
    }
  }

  // Enable Tier Features
  static enableTierFeatures(vipAccount, tierName) {
    const tierFeatures = {
      silver: {
        advancedAnalytics: true,
        customBranding: false,
        priorityVisibilityBoost: true,
        prioritySearchListing: true,
        advancedCommunicationTools: false,
        secureMessaging: true,
        exclusiveUIThemes: true,
        prioritySupport: true,
        customDomain: false,
        advancedReporting: false,
      },
      gold: {
        advancedAnalytics: true,
        customBranding: true,
        priorityVisibilityBoost: true,
        prioritySearchListing: true,
        advancedCommunicationTools: true,
        secureMessaging: true,
        exclusiveUIThemes: true,
        prioritySupport: true,
        customDomain: true,
        advancedReporting: true,
      },
      platinum: {
        advancedAnalytics: true,
        customBranding: true,
        priorityVisibilityBoost: true,
        prioritySearchListing: true,
        advancedCommunicationTools: true,
        secureMessaging: true,
        exclusiveUIThemes: true,
        prioritySupport: true,
        customDomain: true,
        advancedReporting: true,
      },
      diamond: {
        advancedAnalytics: true,
        customBranding: true,
        priorityVisibilityBoost: true,
        prioritySearchListing: true,
        advancedCommunicationTools: true,
        secureMessaging: true,
        exclusiveUIThemes: true,
        prioritySupport: true,
        customDomain: true,
        advancedReporting: true,
      },
    };

    const features = tierFeatures[tierName.toLowerCase()] || {};
    Object.assign(vipAccount.features, features);

    // Set support level
    if (tierName === 'Diamond') {
      vipAccount.supportLevel = 'dedicated';
    } else if (tierName === 'Platinum') {
      vipAccount.supportLevel = 'priority';
    } else {
      vipAccount.supportLevel = 'priority';
    }
  }

  // Renew VIP Subscription
  static async renewVIPSubscription(userId) {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      if (!vipAccount.autoRenewal) {
        throw new Error('Auto-renewal is disabled');
      }

      const durationInDays = this.getDurationInDays(vipAccount.subscriptionDuration);
      const newEndDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

      vipAccount.subscriptionStartDate = new Date();
      vipAccount.subscriptionEndDate = newEndDate;
      vipAccount.subscriptionStatus = 'active';

      await vipAccount.save();

      await NotificationService.sendNotification(userId, {
        title: '✅ VIP Subscription Renewed',
        message: `Your VIP ${vipAccount.vipTier} subscription has been renewed`,
        type: 'vip_renewed',
      });

      await AuditLog.logActivity({
        userId,
        action: 'vip_subscription_renewed',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `VIP subscription renewed: ${vipAccount.vipTier}`,
        performedBy: { userType: 'system' },
      });

      return vipAccount;
    } catch (error) {
      throw error;
    }
  }

  // Upgrade VIP Tier
  static async upgradeVIPTier(userId, newTier) {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      const tier = await SubscriptionTier.findById(newTier);
      if (!tier) {
        throw new Error('VIP tier not found');
      }

      vipAccount.vipTier = tier.tierName.toLowerCase();
      vipAccount.tierLevel = tier.tierLevel;
      this.enableTierFeatures(vipAccount, tier.tierName);

      await vipAccount.save();

      await NotificationService.sendNotification(userId, {
        title: '🎉 VIP Tier Upgraded',
        message: `You've been upgraded to ${tier.tierName}!`,
        type: 'vip_upgraded',
      });

      await AuditLog.logActivity({
        userId,
        action: 'vip_tier_upgraded',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `VIP tier upgraded to: ${tier.tierName}`,
        performedBy: { userType: 'user', userId },
      });

      return vipAccount;
    } catch (error) {
      throw error;
    }
  }

  // Apply Priority Boost
  static async applyPriorityBoost(userId, durationDays = 7) {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      if (!vipAccount.features.priorityVisibilityBoost) {
        throw new Error('Priority boost not available in your tier');
      }

      await vipAccount.applyPriorityBoost(durationDays);

      await NotificationService.sendNotification(userId, {
        title: '🚀 Priority Boost Applied',
        message: `Your profile visibility has been boosted for ${durationDays} days!`,
        type: 'priority_boost_applied',
      });

      return vipAccount;
    } catch (error) {
      throw error;
    }
  }

  // Get VIP Dashboard
  static async getVIPDashboard(userId) {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      const daysRemaining = Math.ceil(
        (vipAccount.subscriptionEndDate - new Date()) / (1000 * 60 * 60 * 24)
      );

      return {
        vipTier: vipAccount.vipTier,
        subscriptionStatus: vipAccount.subscriptionStatus,
        daysRemaining: Math.max(0, daysRemaining),
        features: vipAccount.features,
        analyticsAccess: vipAccount.analyticsAccess,
        priorityBoost: vipAccount.priorityBoost,
        supportLevel: vipAccount.supportLevel,
        usage: vipAccount.usage,
        billingHistory: vipAccount.billingHistory.slice(-5),
      };
    } catch (error) {
      throw error;
    }
  }

  // Generate Custom Report
  static async generateCustomReport(userId, reportType, dateRange) {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      if (!vipAccount.features.advancedReporting) {
        throw new Error('Advanced reporting not available in your tier');
      }

      // TODO: Generate report based on reportType and dateRange

      await vipAccount.updateUsage('report');

      return { success: true, reportType, dateRange };
    } catch (error) {
      throw error;
    }
  }

  // Apply Custom Branding
  static async applyCustomBranding(userId, brandingData) {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      if (!vipAccount.features.customBranding) {
        throw new Error('Custom branding not available in your tier');
      }

      Object.assign(vipAccount.customBrandingSettings, brandingData);
      await vipAccount.updateUsage('customization');
      await vipAccount.save();

      await AuditLog.logActivity({
        userId,
        action: 'custom_branding_applied',
        actionCategory: 'profile',
        actionStatus: 'success',
        description: 'Custom branding applied',
        performedBy: { userType: 'user', userId },
      });

      return vipAccount;
    } catch (error) {
      throw error;
    }
  }

  // Cancel VIP Subscription
  static async cancelVIPSubscription(userId, reason = '') {
    try {
      const vipAccount = await VIPAccount.findOne({ userId });
      if (!vipAccount) {
        throw new Error('VIP account not found');
      }

      await vipAccount.cancelSubscription(reason);

      await NotificationService.sendNotification(userId, {
        title: 'VIP Subscription Cancelled',
        message: 'Your VIP subscription has been cancelled',
        type: 'vip_cancelled',
      });

      await AuditLog.logActivity({
        userId,
        action: 'vip_subscription_cancelled',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `VIP subscription cancelled: ${reason}`,
        performedBy: { userType: 'user', userId },
      });

      return vipAccount;
    } catch (error) {
      throw error;
    }
  }

  // Helper: Get Duration in Days
  static getDurationInDays(duration) {
    const durationMap = {
      '1-month': 30,
      '3-months': 90,
      '6-months': 180,
      '1-year': 365,
    };
    return durationMap[duration] || 30;
  }
}

export default VIPService;
