import IdentityVerification from '../models/IdentityVerification.js';
import ComplianceChecklist from '../models/ComplianceChecklist.js';
import AuditLog from '../models/AuditLog.js';

class VerificationService {
  // Submit Document for Verification
  static async submitDocument(userId, documentData) {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      verification.documents.push({
        documentId: new mongoose.Types.ObjectId(),
        ...documentData,
        uploadedAt: new Date(),
      });

      verification.verificationStatus = 'pending';
      await verification.save();

      await AuditLog.logActivity({
        userId,
        action: 'document_submitted',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Document submitted: ${documentData.documentType}`,
        performedBy: { userType: 'user', userId },
      });

      return verification;
    } catch (error) {
      throw error;
    }
  }

  // Verify Document
  static async verifyDocument(userId, documentId, status, rejectionReason = '') {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      const document = verification.documents.find((d) => d.documentId.toString() === documentId.toString());
      if (!document) {
        throw new Error('Document not found');
      }

      document.verificationStatus = status;
      document.verificationDate = new Date();
      if (rejectionReason) {
        document.rejectionReason = rejectionReason;
      }

      await verification.save();

      await AuditLog.logActivity({
        userId,
        action: 'document_verified',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Document verified: ${document.documentType} - ${status}`,
        performedBy: { userType: 'admin' },
      });

      return verification;
    } catch (error) {
      throw error;
    }
  }

  // Submit Liveness Verification
  static async submitLivenessVerification(userId, videoUrl, livenessScore, faceMatchScore) {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      verification.livenessVerification.status = 'verified';
      verification.livenessVerification.videoUrl = videoUrl;
      verification.livenessVerification.verificationDate = new Date();
      verification.livenessVerification.livenessScore = livenessScore;
      verification.livenessVerification.faceMatchScore = faceMatchScore;

      if (livenessScore >= 80 && faceMatchScore >= 80) {
        verification.livenessVerification.status = 'verified';
      } else {
        verification.livenessVerification.status = 'failed';
        verification.livenessVerification.failureReason = 'Score below threshold';
      }

      await verification.save();

      await AuditLog.logActivity({
        userId,
        action: 'liveness_verification',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Liveness verification: ${verification.livenessVerification.status}`,
        performedBy: { userType: 'system' },
      });

      return verification;
    } catch (error) {
      throw error;
    }
  }

  // Calculate Risk Score
  static async calculateRiskScore(userId) {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      verification.calculateRiskScore();
      await verification.save();

      return verification.riskAssessment;
    } catch (error) {
      throw error;
    }
  }

  // Complete Verification
  static async completeVerification(userId) {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      // Check if all required documents are verified
      const allDocumentsVerified = verification.documents.every(
        (d) => d.verificationStatus === 'verified'
      );

      if (!allDocumentsVerified) {
        throw new Error('Not all documents are verified');
      }

      // Check if liveness is verified
      if (verification.livenessVerification.status !== 'verified') {
        throw new Error('Liveness verification not completed');
      }

      verification.verificationStatus = 'verified';
      verification.verificationLevel = 'level_3';
      verification.verificationCompletionDate = new Date();
      verification.verifiedBadge = true;

      await verification.save();

      // Update compliance checklist
      const compliance = await ComplianceChecklist.findOne({ userId });
      if (compliance) {
        compliance.basicKYC.identityDocumentVerified = true;
        compliance.basicKYC.selfieVerified = true;
        compliance.updateComplianceStatus();
      }

      await AuditLog.logActivity({
        userId,
        action: 'verification_completed',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: 'User verification completed',
        performedBy: { userType: 'system' },
      });

      return verification;
    } catch (error) {
      throw error;
    }
  }

  // Suspend Verification
  static async suspendVerification(userId, reason = '') {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      await verification.suspendAccount(reason);

      await AuditLog.logActivity({
        userId,
        action: 'account_suspended',
        actionCategory: 'compliance',
        actionStatus: 'success',
        description: `Account suspended: ${reason}`,
        performedBy: { userType: 'admin' },
      });

      return verification;
    } catch (error) {
      throw error;
    }
  }

  // Get Verification Status
  static async getVerificationStatus(userId) {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      return {
        verificationStatus: verification.verificationStatus,
        verificationLevel: verification.verificationLevel,
        verifiedBadge: verification.verifiedBadge,
        documents: verification.documents.map((d) => ({
          documentType: d.documentType,
          status: d.verificationStatus,
        })),
        liveness: {
          status: verification.livenessVerification.status,
          livenessScore: verification.livenessVerification.livenessScore,
          faceMatchScore: verification.livenessVerification.faceMatchScore,
        },
        riskAssessment: verification.riskAssessment,
      };
    } catch (error) {
      throw error;
    }
  }

  // Resend Verification Code
  static async resendVerificationCode(userId, verificationType = 'email') {
    try {
      const verification = await IdentityVerification.findOne({ userId });
      if (!verification) {
        throw new Error('Verification record not found');
      }

      const code = Math.floor(100000 + Math.random() * 900000).toString();

      if (verificationType === 'email') {
        verification.emailVerification.verificationCode = code;
        verification.emailVerification.attempts += 1;
      } else if (verificationType === 'phone') {
        verification.phoneVerification.verificationCode = code;
        verification.phoneVerification.attempts += 1;
      }

      await verification.save();

      // TODO: Send code via email or SMS

      return { success: true, message: `Verification code sent via ${verificationType}` };
    } catch (error) {
      throw error;
    }
  }
}

export default VerificationService;
