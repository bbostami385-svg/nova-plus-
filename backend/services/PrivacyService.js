import Privacy from '../models/Privacy.js';
import User from '../models/User.js';

class PrivacyService {
  // Initialize privacy settings
  async initializePrivacy(userId) {
    try {
      const existingPrivacy = await Privacy.findOne({ userId });
      if (existingPrivacy) {
        throw new Error('Privacy settings already exist');
      }

      const privacy = new Privacy({
        userId,
      });

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to initialize privacy: ${error.message}`);
    }
  }

  // Get privacy settings
  async getPrivacySettings(userId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      return privacy;
    } catch (error) {
      throw new Error(`Failed to fetch privacy settings: ${error.message}`);
    }
  }

  // Update account privacy
  async updateAccountPrivacy(userId, accountPrivacy) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.accountPrivacy = {
        ...privacy.accountPrivacy,
        ...accountPrivacy,
      };

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to update account privacy: ${error.message}`);
    }
  }

  // Block user
  async blockUser(userId, blockedUserId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      if (privacy.blockedUsers.includes(blockedUserId)) {
        throw new Error('User already blocked');
      }

      privacy.blockedUsers.push(blockedUserId);
      await privacy.save();

      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to block user: ${error.message}`);
    }
  }

  // Unblock user
  async unblockUser(userId, blockedUserId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.blockedUsers = privacy.blockedUsers.filter(
        (id) => id.toString() !== blockedUserId.toString()
      );

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to unblock user: ${error.message}`);
    }
  }

  // Get blocked users
  async getBlockedUsers(userId) {
    try {
      const privacy = await Privacy.findOne({ userId }).populate(
        'blockedUsers',
        'username profilePicture'
      );

      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      return privacy.blockedUsers;
    } catch (error) {
      throw new Error(`Failed to fetch blocked users: ${error.message}`);
    }
  }

  // Mute user
  async muteUser(userId, mutedUserId, muteType = 'all') {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      const existingMute = privacy.mutedUsers.find(
        (m) => m.userId.toString() === mutedUserId.toString()
      );

      if (existingMute) {
        existingMute.muteType = muteType;
      } else {
        privacy.mutedUsers.push({
          userId: mutedUserId,
          muteType,
          mutedAt: new Date(),
        });
      }

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to mute user: ${error.message}`);
    }
  }

  // Unmute user
  async unmuteUser(userId, mutedUserId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.mutedUsers = privacy.mutedUsers.filter(
        (m) => m.userId.toString() !== mutedUserId.toString()
      );

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to unmute user: ${error.message}`);
    }
  }

  // Enable two-factor authentication
  async enableTwoFactorAuth(userId, method, phoneNumber = null) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.twoFactorAuth.enabled = true;
      privacy.twoFactorAuth.method = method;

      if (method === 'sms' && phoneNumber) {
        privacy.twoFactorAuth.phoneNumber = phoneNumber;
      }

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();
      privacy.twoFactorAuth.backupCodes = backupCodes;

      await privacy.save();

      return {
        success: true,
        privacy,
        backupCodes,
      };
    } catch (error) {
      throw new Error(`Failed to enable 2FA: ${error.message}`);
    }
  }

  // Disable two-factor authentication
  async disableTwoFactorAuth(userId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.twoFactorAuth.enabled = false;
      privacy.twoFactorAuth.backupCodes = [];

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to disable 2FA: ${error.message}`);
    }
  }

  // Request data export
  async requestDataExport(userId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.dataExport = {
        requestedAt: new Date(),
        status: 'processing',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      };

      await privacy.save();

      // TODO: Trigger data export job

      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to request data export: ${error.message}`);
    }
  }

  // Request account deletion
  async requestAccountDeletion(userId, reason) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.accountDeletion = {
        requestedAt: new Date(),
        scheduledFor: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        reason,
        status: 'pending',
      };

      await privacy.save();

      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to request account deletion: ${error.message}`);
    }
  }

  // Cancel account deletion
  async cancelAccountDeletion(userId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.accountDeletion = {
        status: 'cancelled',
      };

      await privacy.save();

      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to cancel account deletion: ${error.message}`);
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId, preferences) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      privacy.notificationPreferences = {
        ...privacy.notificationPreferences,
        ...preferences,
      };

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`);
    }
  }

  // Revoke third-party access
  async revokeThirdPartyAccess(userId, appName) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        throw new Error('Privacy settings not found');
      }

      const app = privacy.thirdPartyAccess.find((a) => a.appName === appName);
      if (!app) {
        throw new Error('Third-party app not found');
      }

      app.revokedAt = new Date();

      await privacy.save();
      return { success: true, privacy };
    } catch (error) {
      throw new Error(`Failed to revoke third-party access: ${error.message}`);
    }
  }

  // Generate backup codes
  generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  // Check if user is blocked
  async isUserBlocked(userId, targetUserId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        return false;
      }

      return privacy.blockedUsers.some(
        (id) => id.toString() === targetUserId.toString()
      );
    } catch (error) {
      console.error('Failed to check if user is blocked:', error);
      return false;
    }
  }

  // Check if user is muted
  async isUserMuted(userId, targetUserId) {
    try {
      const privacy = await Privacy.findOne({ userId });
      if (!privacy) {
        return false;
      }

      return privacy.mutedUsers.some(
        (m) => m.userId.toString() === targetUserId.toString()
      );
    } catch (error) {
      console.error('Failed to check if user is muted:', error);
      return false;
    }
  }
}

export default new PrivacyService();
