import Subscription from '../models/Subscription.js';
import VIPAccount from '../models/VIPAccount.js';
import SubscriptionTier from '../models/SubscriptionTier.js';
import AuditLog from '../models/AuditLog.js';
import NotificationService from './NotificationService.js';

class SubscriptionService {
  // Create Subscription
  static async createSubscription(userId, tierId, duration, paymentMethod, amount) {
    try {
      const tier = await SubscriptionTier.findById(tierId);
      if (!tier) {
        throw new Error('Subscription tier not found');
      }

      const durationInDays = this.getDurationInDays(duration);
      const endDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

      const subscription = new Subscription({
        userId,
        tierId,
        tierName: tier.tierName,
        tierPrice: tier.monthlyPrice,
        startDate: new Date(),
        endDate,
        duration,
        durationInDays,
        paymentMethod,
        paymentStatus: 'pending',
        amount,
        autoRenewal: true,
      });

      await subscription.save();

      await AuditLog.logActivity({
        userId,
        action: 'subscription_created',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `Subscription created: ${tier.tierName} - ${duration}`,
        performedBy: { userType: 'user', userId },
      });

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // Process Payment
  static async processPayment(subscriptionId, paymentDetails) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // TODO: Integrate with payment gateway (Stripe, PayPal, etc.)
      subscription.paymentStatus = 'completed';
      subscription.paymentId = paymentDetails.paymentId;
      subscription.transactionId = paymentDetails.transactionId;
      subscription.status = 'active';

      await subscription.save();

      await AuditLog.logActivity({
        userId: subscription.userId,
        action: 'payment_processed',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `Payment processed: ${subscription.amount} ${subscription.currency}`,
        performedBy: { userType: 'system' },
      });

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // Renew Subscription
  static async renewSubscription(subscriptionId) {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (!subscription.autoRenewal) {
        throw new Error('Auto-renewal is disabled');
      }

      const durationInDays = this.getDurationInDays(subscription.duration);
      const newEndDate = new Date(Date.now() + durationInDays * 24 * 60 * 60 * 1000);

      subscription.startDate = new Date();
      subscription.endDate = newEndDate;
      subscription.renewalDate = null;
      subscription.status = 'active';

      await subscription.save();

      await AuditLog.logActivity({
        userId: subscription.userId,
        action: 'subscription_renewed',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `Subscription renewed: ${subscription.tierName}`,
        performedBy: { userType: 'system' },
      });

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // Cancel Subscription
  static async cancelSubscription(subscriptionId, reason = '') {
    try {
      const subscription = await Subscription.findById(subscriptionId);
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      subscription.status = 'cancelled';
      subscription.cancellationDate = new Date();
      subscription.cancellationReason = reason;
      subscription.autoRenewal = false;

      await subscription.save();

      await AuditLog.logActivity({
        userId: subscription.userId,
        action: 'subscription_cancelled',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `Subscription cancelled: ${reason}`,
        performedBy: { userType: 'user', userId: subscription.userId },
      });

      return subscription;
    } catch (error) {
      throw error;
    }
  }

  // Check Expiry and Send Notifications
  static async checkExpiryAndNotify() {
    try {
      const now = new Date();
      const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const threeDaysLater = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
      const oneDayLater = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000);

      // 7 days reminder
      const sevenDaysSubscriptions = await Subscription.find({
        endDate: { $lte: sevenDaysLater, $gt: new Date(sevenDaysLater.getTime() - 1 * 24 * 60 * 60 * 1000) },
        status: 'active',
      });

      for (const sub of sevenDaysSubscriptions) {
        if (!sub.expiryNotifications?.sevenDaysNotified) {
          await NotificationService.sendNotification(sub.userId, {
            title: 'Subscription Expiring Soon',
            message: `Your ${sub.tierName} subscription will expire in 7 days`,
            type: 'subscription_reminder',
          });
          sub.expiryNotifications.sevenDaysNotified = true;
          await sub.save();
        }
      }

      // 3 days alert
      const threeDaysSubscriptions = await Subscription.find({
        endDate: { $lte: threeDaysLater, $gt: new Date(threeDaysLater.getTime() - 1 * 24 * 60 * 60 * 1000) },
        status: 'active',
      });

      for (const sub of threeDaysSubscriptions) {
        if (!sub.expiryNotifications?.threeDaysNotified) {
          await NotificationService.sendNotification(sub.userId, {
            title: 'Subscription Expiring Soon',
            message: `Your ${sub.tierName} subscription will expire in 3 days`,
            type: 'subscription_alert',
          });
          sub.expiryNotifications.threeDaysNotified = true;
          await sub.save();
        }
      }

      // 1 day final warning
      const oneDaySubscriptions = await Subscription.find({
        endDate: { $lte: oneDayLater, $gt: new Date(oneDayLater.getTime() - 1 * 24 * 60 * 60 * 1000) },
        status: 'active',
      });

      for (const sub of oneDaySubscriptions) {
        if (!sub.expiryNotifications?.oneDayNotified) {
          await NotificationService.sendNotification(sub.userId, {
            title: 'Subscription Expiring Today',
            message: `Your ${sub.tierName} subscription will expire in 1 day. Renew now to continue enjoying premium features.`,
            type: 'subscription_final_warning',
          });
          sub.expiryNotifications.oneDayNotified = true;
          await sub.save();
        }
      }

      // Auto-renew if enabled
      const expiredSubscriptions = await Subscription.find({
        endDate: { $lte: now },
        status: 'active',
        autoRenewal: true,
      });

      for (const sub of expiredSubscriptions) {
        try {
          await this.renewSubscription(sub._id);
        } catch (error) {
          console.error(`Failed to auto-renew subscription ${sub._id}:`, error);
        }
      }

      return { success: true };
    } catch (error) {
      throw error;
    }
  }

  // Get Subscription Status
  static async getSubscriptionStatus(userId) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        return { hasSubscription: false };
      }

      const daysRemaining = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));

      return {
        hasSubscription: true,
        tier: subscription.tierName,
        status: subscription.status,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        daysRemaining: Math.max(0, daysRemaining),
        autoRenewal: subscription.autoRenewal,
      };
    } catch (error) {
      throw error;
    }
  }

  // Upgrade Subscription
  static async upgradeSubscription(userId, newTierId) {
    try {
      const subscription = await Subscription.findOne({ userId });
      if (!subscription) {
        throw new Error('Subscription not found');
      }

      const newTier = await SubscriptionTier.findById(newTierId);
      if (!newTier) {
        throw new Error('New tier not found');
      }

      // Calculate pro-rata refund/charge
      const daysRemaining = Math.ceil((subscription.endDate - new Date()) / (1000 * 60 * 60 * 24));
      const currentTierDailyPrice = subscription.tierPrice / 30;
      const newTierDailyPrice = newTier.monthlyPrice / 30;
      const prorataCharge = (newTierDailyPrice - currentTierDailyPrice) * daysRemaining;

      subscription.tierId = newTierId;
      subscription.tierName = newTier.tierName;
      subscription.tierPrice = newTier.monthlyPrice;
      subscription.amount = prorataCharge;

      await subscription.save();

      await AuditLog.logActivity({
        userId,
        action: 'subscription_upgraded',
        actionCategory: 'payment',
        actionStatus: 'success',
        description: `Subscription upgraded to: ${newTier.tierName}`,
        performedBy: { userType: 'user', userId },
      });

      return subscription;
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

export default SubscriptionService;
