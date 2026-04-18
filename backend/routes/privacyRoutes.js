import express from 'express';
import { auth } from '../middleware/auth.js';
import PrivacyService from '../services/PrivacyService.js';

const router = express.Router();

// Initialize privacy settings
router.post('/initialize', auth, async (req, res) => {
  try {
    const result = await PrivacyService.initializePrivacy(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get privacy settings
router.get('/settings', auth, async (req, res) => {
  try {
    const settings = await PrivacyService.getPrivacySettings(req.user.id);
    res.json(settings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update account privacy
router.put('/account-privacy', auth, async (req, res) => {
  try {
    const result = await PrivacyService.updateAccountPrivacy(
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Block user
router.post('/block/:userId', auth, async (req, res) => {
  try {
    const result = await PrivacyService.blockUser(req.user.id, req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unblock user
router.post('/unblock/:userId', auth, async (req, res) => {
  try {
    const result = await PrivacyService.unblockUser(req.user.id, req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get blocked users
router.get('/blocked-users', auth, async (req, res) => {
  try {
    const blockedUsers = await PrivacyService.getBlockedUsers(req.user.id);
    res.json(blockedUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mute user
router.post('/mute/:userId', auth, async (req, res) => {
  try {
    const result = await PrivacyService.muteUser(
      req.user.id,
      req.params.userId,
      req.body.muteType
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Unmute user
router.post('/unmute/:userId', auth, async (req, res) => {
  try {
    const result = await PrivacyService.unmuteUser(req.user.id, req.params.userId);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Enable two-factor authentication
router.post('/2fa/enable', auth, async (req, res) => {
  try {
    const result = await PrivacyService.enableTwoFactorAuth(
      req.user.id,
      req.body.method,
      req.body.phoneNumber
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disable two-factor authentication
router.post('/2fa/disable', auth, async (req, res) => {
  try {
    const result = await PrivacyService.disableTwoFactorAuth(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request data export
router.post('/data-export/request', auth, async (req, res) => {
  try {
    const result = await PrivacyService.requestDataExport(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Request account deletion
router.post('/account-deletion/request', auth, async (req, res) => {
  try {
    const result = await PrivacyService.requestAccountDeletion(
      req.user.id,
      req.body.reason
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel account deletion
router.post('/account-deletion/cancel', auth, async (req, res) => {
  try {
    const result = await PrivacyService.cancelAccountDeletion(req.user.id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update notification preferences
router.put('/notification-preferences', auth, async (req, res) => {
  try {
    const result = await PrivacyService.updateNotificationPreferences(
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Revoke third-party access
router.post('/revoke-access/:appName', auth, async (req, res) => {
  try {
    const result = await PrivacyService.revokeThirdPartyAccess(
      req.user.id,
      req.params.appName
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
