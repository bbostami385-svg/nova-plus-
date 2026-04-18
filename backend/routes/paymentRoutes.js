import express from 'express';
import { auth } from '../middleware/auth.js';
import PaymentService from '../services/payment/PaymentService.js';
import Transaction from '../models/Transaction.js';
import Refund from '../models/Refund.js';

const router = express.Router();

// ============ PAYMENT INITIATION ============

/**
 * Initiate payment
 * POST /api/payments/initiate
 */
router.post('/initiate', auth, async (req, res) => {
  try {
    const {
      amount,
      currency = 'BDT',
      paymentMethod = 'card',
      purpose = 'product_purchase',
      relatedItemId = null,
      relatedItemType = null,
      customerEmail,
      customerPhone,
      customerName,
      successUrl,
      failUrl,
      cancelUrl,
      metadata = {},
    } = req.body;

    // Validate required fields
    if (!amount || !customerEmail || !customerPhone || !successUrl || !failUrl || !cancelUrl) {
      return res.status(400).json({
        error: 'Missing required fields',
      });
    }

    // Add request metadata
    metadata.ipAddress = req.ip;
    metadata.userAgent = req.get('user-agent');

    const result = await PaymentService.initiatePayment(req.user.id, {
      amount,
      currency,
      paymentMethod,
      purpose,
      relatedItemId,
      relatedItemType,
      customerEmail,
      customerPhone,
      customerName,
      successUrl,
      failUrl,
      cancelUrl,
      metadata,
    });

    res.json(result);
  } catch (error) {
    console.error('Payment initiation error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ PAYMENT VERIFICATION ============

/**
 * Verify payment (callback from SSLCommerz)
 * POST /api/payments/verify
 */
router.post('/verify', async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.body;

    if (!tran_id || !val_id) {
      return res.status(400).json({
        error: 'Missing transaction or validation ID',
      });
    }

    const result = await PaymentService.verifyPayment(tran_id, {
      validationId: val_id,
      status,
    });

    res.json(result);
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get payment status
 * GET /api/payments/:transactionId/status
 */
router.get('/:transactionId/status', async (req, res) => {
  try {
    const result = await PaymentService.getPaymentStatus(req.params.transactionId);
    res.json(result);
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ TRANSACTION HISTORY ============

/**
 * Get transaction history
 * GET /api/payments/history
 */
router.get('/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await PaymentService.getTransactionHistory(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get transaction details
 * GET /api/payments/transaction/:transactionId
 */
router.get('/transaction/:transactionId', auth, async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      transactionId: req.params.transactionId,
      userId: req.user.id,
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ REFUND MANAGEMENT ============

/**
 * Request refund
 * POST /api/payments/:transactionId/refund
 */
router.post('/:transactionId/refund', auth, async (req, res) => {
  try {
    const { reason, reasonDescription, refundAmount } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Refund reason is required' });
    }

    const result = await PaymentService.requestRefund(req.params.transactionId, {
      reason,
      reasonDescription,
      refundAmount,
    });

    res.json(result);
  } catch (error) {
    console.error('Refund request error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get refund history
 * GET /api/payments/refunds/history
 */
router.get('/refunds/history', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await PaymentService.getRefundHistory(req.user.id, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Get refund history error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get refund details
 * GET /api/payments/refund/:refundId
 */
router.get('/refund/:refundId', auth, async (req, res) => {
  try {
    const refund = await Refund.findOne({
      refundId: req.params.refundId,
      userId: req.user.id,
    });

    if (!refund) {
      return res.status(404).json({ error: 'Refund not found' });
    }

    res.json(refund);
  } catch (error) {
    console.error('Get refund error:', error);
    res.status(400).json({ error: error.message });
  }
});

// ============ ADMIN ENDPOINTS ============

/**
 * Process refund (admin only)
 * POST /api/payments/admin/refund/:refundId/process
 */
router.post('/admin/refund/:refundId/process', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { action, notes } = req.body;

    if (!action || !['approve', 'reject'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const result = await PaymentService.processRefund(
      req.params.refundId,
      req.user.id,
      action,
      notes
    );

    res.json(result);
  } catch (error) {
    console.error('Process refund error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get all transactions (admin)
 * GET /api/payments/admin/transactions
 */
router.get('/admin/transactions', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const skip = (page - 1) * limit;
    const query = status ? { status } : {};

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('userId', 'username email');

    const total = await Transaction.countDocuments(query);

    res.json({
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * Get gateway status
 * GET /api/payments/gateway/status
 */
router.get('/gateway/status', async (req, res) => {
  try {
    const status = await PaymentService.getGatewayStatus();
    res.json(status);
  } catch (error) {
    console.error('Get gateway status error:', error);
    res.status(400).json({ error: error.message });
  }
});

export default router;
