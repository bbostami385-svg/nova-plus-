import nodemailer from 'nodemailer';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

class NotificationService {
  // Initialize Email Transporter
  static getEmailTransporter() {
    return nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  // Send Email Notification
  static async sendEmailNotification(email, subject, htmlContent, textContent = '') {
    try {
      const transporter = this.getEmailTransporter();

      const mailOptions = {
        from: process.env.EMAIL_FROM || 'noreply@novaplus.com',
        to: email,
        subject,
        html: htmlContent,
        text: textContent,
      };

      await transporter.sendMail(mailOptions);
      return { success: true };
    } catch (error) {
      console.error('Email notification error:', error);
      throw error;
    }
  }

  // Send SMS Notification (Placeholder - integrate with Twilio/AWS SNS)
  static async sendSMSNotification(phoneNumber, message) {
    try {
      // TODO: Integrate with Twilio or AWS SNS
      console.log(`SMS to ${phoneNumber}: ${message}`);
      return { success: true };
    } catch (error) {
      console.error('SMS notification error:', error);
      throw error;
    }
  }

  // Send In-App Notification
  static async sendInAppNotification(userId, notificationData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Store notification in database
      if (!user.notifications) {
        user.notifications = [];
      }

      user.notifications.push({
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        read: false,
        createdAt: new Date(),
      });

      await user.save();

      // TODO: Emit WebSocket event for real-time notification
      return { success: true };
    } catch (error) {
      console.error('In-app notification error:', error);
      throw error;
    }
  }

  // Send Notification (Multi-channel)
  static async sendNotification(userId, notificationData, channels = ['email', 'inapp']) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const results = {};

      // Send Email
      if (channels.includes('email') && user.email) {
        try {
          const emailContent = this.generateEmailTemplate(notificationData);
          results.email = await this.sendEmailNotification(
            user.email,
            notificationData.title,
            emailContent.html,
            emailContent.text
          );
        } catch (error) {
          console.error('Email send failed:', error);
          results.email = { success: false, error: error.message };
        }
      }

      // Send SMS
      if (channels.includes('sms') && user.phone) {
        try {
          results.sms = await this.sendSMSNotification(user.phone, notificationData.message);
        } catch (error) {
          console.error('SMS send failed:', error);
          results.sms = { success: false, error: error.message };
        }
      }

      // Send In-App
      if (channels.includes('inapp')) {
        try {
          results.inapp = await this.sendInAppNotification(userId, notificationData);
        } catch (error) {
          console.error('In-app send failed:', error);
          results.inapp = { success: false, error: error.message };
        }
      }

      await AuditLog.logActivity({
        userId,
        action: 'notification_sent',
        actionCategory: 'other',
        actionStatus: 'success',
        description: `Notification sent: ${notificationData.title}`,
        performedBy: { userType: 'system' },
      });

      return results;
    } catch (error) {
      throw error;
    }
  }

  // Send Verification Email
  static async sendVerificationEmail(email, verificationCode) {
    try {
      const htmlContent = `
        <h2>Email Verification</h2>
        <p>Your verification code is: <strong>${verificationCode}</strong></p>
        <p>This code will expire in 24 hours.</p>
      `;

      return await this.sendEmailNotification(email, 'Email Verification', htmlContent);
    } catch (error) {
      throw error;
    }
  }

  // Send Password Reset Email
  static async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      const htmlContent = `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <a href="${resetLink}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
      `;

      return await this.sendEmailNotification(email, 'Password Reset', htmlContent);
    } catch (error) {
      throw error;
    }
  }

  // Send Subscription Renewal Reminder
  static async sendSubscriptionRenewalReminder(userId, subscriptionData) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      const htmlContent = `
        <h2>Subscription Renewal Reminder</h2>
        <p>Your ${subscriptionData.tierName} subscription will expire on ${subscriptionData.endDate.toDateString()}</p>
        <p>Click below to renew your subscription:</p>
        <a href="${process.env.FRONTEND_URL}/subscription/renew">Renew Subscription</a>
      `;

      return await this.sendNotification(userId, {
        title: 'Subscription Expiring Soon',
        message: `Your ${subscriptionData.tierName} subscription will expire soon`,
        type: 'subscription_reminder',
      });
    } catch (error) {
      throw error;
    }
  }

  // Send Welcome Email
  static async sendWelcomeEmail(email, firstName) {
    try {
      const htmlContent = `
        <h2>Welcome to NovaPlus!</h2>
        <p>Hi ${firstName},</p>
        <p>Thank you for joining NovaPlus. We're excited to have you on board!</p>
        <p>Get started by completing your profile and verifying your identity.</p>
        <a href="${process.env.FRONTEND_URL}/profile/complete">Complete Profile</a>
      `;

      return await this.sendEmailNotification(email, 'Welcome to NovaPlus', htmlContent);
    } catch (error) {
      throw error;
    }
  }

  // Send Achievement Unlock Notification
  static async sendAchievementUnlockNotification(userId, achievementData) {
    try {
      return await this.sendNotification(userId, {
        title: '🎉 Achievement Unlocked!',
        message: `You've unlocked: ${achievementData.achievementName}`,
        type: 'achievement_unlocked',
      });
    } catch (error) {
      throw error;
    }
  }

  // Send Level Up Notification
  static async sendLevelUpNotification(userId, newLevel) {
    try {
      return await this.sendNotification(userId, {
        title: '⬆️ Level Up!',
        message: `Congratulations! You've reached Level ${newLevel}`,
        type: 'level_up',
      });
    } catch (error) {
      throw error;
    }
  }

  // Send Diamond Earning Notification
  static async sendDiamondEarningNotification(userId, diamondAmount, source) {
    try {
      return await this.sendNotification(userId, {
        title: '💎 Diamonds Earned!',
        message: `You earned ${diamondAmount} diamonds from ${source}`,
        type: 'diamond_earned',
      });
    } catch (error) {
      throw error;
    }
  }

  // Send Sponsorship Offer Notification
  static async sendSponsorshipOfferNotification(userId, sponsorData) {
    try {
      return await this.sendNotification(userId, {
        title: '🤝 New Sponsorship Offer',
        message: `${sponsorData.companyName} is interested in sponsoring you!`,
        type: 'sponsorship_offer',
      });
    } catch (error) {
      throw error;
    }
  }

  // Send Hiring Request Notification
  static async sendHiringRequestNotification(userId, jobData) {
    try {
      return await this.sendNotification(userId, {
        title: '💼 New Job Opportunity',
        message: `${jobData.company} is interested in hiring you for ${jobData.position}`,
        type: 'hiring_request',
      });
    } catch (error) {
      throw error;
    }
  }

  // Generate Email Template
  static generateEmailTemplate(notificationData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px;">
          <h2 style="color: #333;">${notificationData.title}</h2>
          <p style="color: #666; line-height: 1.6;">${notificationData.message}</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px;">
            <p>© 2024 NovaPlus. All rights reserved.</p>
          </div>
        </div>
      </div>
    `;

    const text = `${notificationData.title}\n\n${notificationData.message}`;

    return { html, text };
  }
}

export default NotificationService;
