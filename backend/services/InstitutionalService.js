import InstitutionalAccount from '../models/InstitutionalAccount.js';
import ComplianceChecklist from '../models/ComplianceChecklist.js';
import AuditLog from '../models/AuditLog.js';
import NotificationService from './NotificationService.js';

class InstitutionalService {
  // Create Institutional Account
  static async createInstitutionalAccount(userId, institutionData) {
    try {
      const institutionalAccount = new InstitutionalAccount({
        userId,
        institutionName: institutionData.institutionName,
        institutionType: institutionData.institutionType,
        registrationNumber: institutionData.registrationNumber,
        officialEmail: institutionData.officialEmail,
        officialPhone: institutionData.officialPhone,
        officialAddress: institutionData.officialAddress,
        officialWebsite: institutionData.officialWebsite,
      });

      await institutionalAccount.save();

      // Create compliance checklist
      const compliance = new ComplianceChecklist({
        userId,
        accountType: 'institutional',
      });

      await compliance.save();

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'institutional_account_created',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Institutional account created: ${institutionData.institutionName}`,
        performedBy: { userType: 'system' },
      });

      return institutionalAccount;
    } catch (error) {
      throw error;
    }
  }

  // Add Authorized Representative
  static async addAuthorizedRepresentative(userId, representativeData) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      await account.addRepresentative(representativeData);

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'representative_added',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Representative added: ${representativeData.name}`,
        performedBy: { userType: 'admin' },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Verify Representative
  static async verifyRepresentative(userId, representativeId, status) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      const representative = account.authorizedRepresentatives.find(
        (r) => r.representativeId.toString() === representativeId.toString()
      );

      if (!representative) {
        throw new Error('Representative not found');
      }

      representative.verificationStatus = status;

      await account.save();

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'representative_verified',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Representative verified: ${representative.name} - ${status}`,
        performedBy: { userType: 'admin' },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Add Team Member
  static async addTeamMember(userId, memberData) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      await account.addTeamMember(memberData);

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'team_member_added',
        actionCategory: 'profile',
        actionStatus: 'success',
        description: `Team member added: ${memberData.name}`,
        performedBy: { userType: 'user', userId },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Update Institutional Profile
  static async updateInstitutionalProfile(userId, profileData) {
    try {
      const account = await InstitutionalAccount.findOneAndUpdate({ userId }, profileData, {
        new: true,
      });

      if (!account) {
        throw new Error('Institutional account not found');
      }

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'profile_updated',
        actionCategory: 'profile',
        actionStatus: 'success',
        description: 'Institutional profile updated',
        performedBy: { userType: 'user', userId },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Calculate Trust Score
  static async calculateTrustScore(userId) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      account.calculateTrustScore();
      await account.save();

      return account.trustScore;
    } catch (error) {
      throw error;
    }
  }

  // Complete Institutional Verification
  static async completeInstitutionalVerification(userId) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      // Check if all documents are verified
      const allDocumentsVerified = account.documents.every(
        (d) => d.verificationStatus === 'verified'
      );

      if (!allDocumentsVerified) {
        throw new Error('Not all documents are verified');
      }

      // Check if all representatives are verified
      const allRepresentativesVerified = account.authorizedRepresentatives.every(
        (r) => r.verificationStatus === 'verified'
      );

      if (!allRepresentativesVerified) {
        throw new Error('Not all representatives are verified');
      }

      account.verificationStatus = 'verified';
      account.verificationLevel = 'level_4';
      account.institutionalBadge = true;
      account.complianceStatus = 'compliant';
      account.publicTrustLabel = true;

      await account.save();

      await NotificationService.sendNotification(userId, {
        title: '✅ Institutional Verification Complete',
        message: 'Your institutional account has been verified and is now active',
        type: 'institutional_verified',
      });

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'institutional_verification_completed',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: 'Institutional verification completed',
        performedBy: { userType: 'admin' },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Get Institutional Dashboard
  static async getInstitutionalDashboard(userId) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      return {
        institutionName: account.institutionName,
        institutionType: account.institutionType,
        verificationStatus: account.verificationStatus,
        trustScore: account.trustScore,
        teamMembers: account.teamMembers.length,
        representatives: account.authorizedRepresentatives.length,
        subscriptionStatus: account.subscriptionStatus,
        features: account.features,
        activityLog: account.activityLog.slice(-10),
      };
    } catch (error) {
      throw error;
    }
  }

  // Enable Premium Features
  static async enablePremiumFeatures(userId, features) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      Object.assign(account.features, features);
      account.isPremium = true;

      await account.save();

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'premium_features_enabled',
        actionCategory: 'profile',
        actionStatus: 'success',
        description: 'Premium features enabled',
        performedBy: { userType: 'admin' },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Suspend Institutional Account
  static async suspendInstitutionalAccount(userId, reason = '') {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      await account.suspendAccount(reason);

      await NotificationService.sendNotification(userId, {
        title: '⚠️ Account Suspended',
        message: `Your institutional account has been suspended. Reason: ${reason}`,
        type: 'account_suspended',
      });

      await AuditLog.logActivity({
        userId,
        accountType: 'institutional',
        action: 'account_suspended',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Account suspended: ${reason}`,
        performedBy: { userType: 'admin' },
      });

      return account;
    } catch (error) {
      throw error;
    }
  }

  // Get Audit Trail
  static async getAuditTrail(userId, limit = 50) {
    try {
      const account = await InstitutionalAccount.findOne({ userId });
      if (!account) {
        throw new Error('Institutional account not found');
      }

      return account.auditTrail.slice(-limit);
    } catch (error) {
      throw error;
    }
  }
}

export default InstitutionalService;
