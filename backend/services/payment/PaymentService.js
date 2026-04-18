import Transaction from '../../models/Transaction.js';
import Wallet from '../../models/Wallet.js';
import Refund from '../../models/Refund.js';
import SSLCommerzGateway from './SSLCommerzGateway.js';
import StripeGateway from './StripeGateway.js';
import crypto from 'crypto';

/**
 * Payment Service - Main service for handling all payment operations
 * Uses factory pattern to switch between payment gateways
 */
class PaymentService {
  constructor() {
    this.gateways = {
      sslcommerz: new SSLCommerzGateway(),
      stripe: new StripeGateway(),
    };
    this.defaultGateway = process.env.DEFAULT_PAYMENT_GATEWAY || 'sslcommerz';
  }

  /**
   * Initialize all payment gateways
   */
  async initializeGateways() {
    try {
      for (const [name, gateway] of Object.entries(this.gateways)) {
        try {
          await gateway.initialize();
          console.log(`✅ ${name} gateway initialized`);
        } catch (error) {
          console.warn(`⚠️ ${name} gateway initialization failed:`, error.message);
        }
      }
    } catch (error) {
      console.error('Gateway initialization error:', error);
      throw error;
    }
  }

  /**
   * Get payment gateway instance
   */
  getGateway(gatewayName = this.defaultGateway) {
    const gateway = this.gateways[gatewayName];
    if (!gateway) {
      throw new Error(`Payment gateway '${gatewayName}' not found`);
    }
    return gateway;
  }

  /**
   * Generate unique transaction ID
   */
  generateTransactionId() {
    return `TXN-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  /**
   * Initiate payment
   */
  async initiatePayment(userId, paymentData) {
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
        gatewayName = this.defaultGateway,
      } = paymentData;

      // Validate required fields
      if (!amount || amount <= 0) {
        throw new Error('Invalid payment amount');
      }

      if (!customerEmail || !customerPhone) {
        throw new Error('Customer email and phone are required');
      }

      // Generate transaction ID
      const transactionId = this.generateTransactionId();

      // Create transaction record
      const transaction = new Transaction({
        transactionId,
        userId,
        amount,
        currency,
        paymentMethod,
        gateway: gatewayName,
        purpose,
        relatedItemId,
        relatedItemType,
        customerEmail,
        customerPhone,
        customerName,
        status: 'pending',
        metadata,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      });

      await transaction.save();

      // Get payment gateway
      const gateway = this.getGateway(gatewayName);

      // Create payment with gateway
      const paymentResult = await gateway.createPayment({
        transactionId,
        amount,
        currency,
        customerEmail,
        customerPhone,
        customerName,
        purpose,
        successUrl,
        failUrl,
        cancelUrl,
        metadata,
      });

      // Update transaction with gateway details
      transaction.gatewayTransactionId = paymentResult.gatewayTransactionId;
      await transaction.save();

      return {
        success: true,
        transactionId,
        ...paymentResult,
      };
    } catch (error) {
      console.error('Payment initiation error:', error);
      throw new Error(`Failed to initiate payment: ${error.message}`);
    }
  }

  /**
   * Verify payment
   */
  async verifyPayment(transactionId, verificationData) {
    try {
      // Find transaction
      const transaction = await Transaction.findOne({ transactionId });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'pending') {
        throw new Error('Transaction already processed');
      }

      // Get gateway
      const gateway = this.getGateway(transaction.gateway);

      // Verify with gateway
      const verificationResult = await gateway.verifyPayment(transactionId, verificationData);

      if (!verificationResult.verified) {
        transaction.status = 'failed';
        transaction.statusReason = 'Payment verification failed';
        await transaction.save();

        return {
          success: false,
          verified: false,
          reason: verificationResult.reason,
        };
      }

      // Update transaction with payment details
      transaction.status = 'success';
      transaction.completedAt = new Date();
      transaction.paymentDetails = {
        bankTransactionId: verificationResult.bankTranId,
        cardBrand: verificationResult.cardBrand,
        cardLastFour: verificationResult.cardNumber?.slice(-4),
        validationId: verificationResult.gatewayTransactionId,
        riskLevel: verificationResult.riskLevel,
        riskTitle: verificationResult.riskTitle,
      };

      await transaction.save();

      // Add to wallet if needed
      if (transaction.purpose === 'wallet_topup') {
        await this.addToWallet(transaction.userId, transaction.amount);
      }

      return {
        success: true,
        verified: true,
        transaction: transaction.toObject(),
      };
    } catch (error) {
      console.error('Payment verification error:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId) {
    try {
      const transaction = await Transaction.findOne({ transactionId });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // If already completed, return cached status
      if (transaction.status !== 'pending') {
        return {
          transactionId,
          status: transaction.status,
          amount: transaction.amount,
          completedAt: transaction.completedAt,
        };
      }

      // Check with gateway
      const gateway = this.getGateway(transaction.gateway);
      const gatewayStatus = await gateway.getPaymentStatus(transactionId);

      return {
        transactionId,
        status: gatewayStatus.status,
        amount: gatewayStatus.amount,
        currency: gatewayStatus.currency,
      };
    } catch (error) {
      console.error('Get payment status error:', error);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Request refund
   */
  async requestRefund(transactionId, refundData) {
    try {
      const { reason, reasonDescription, refundAmount = null } = refundData;

      // Find transaction
      const transaction = await Transaction.findOne({ transactionId });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.status !== 'success') {
        throw new Error('Only successful transactions can be refunded');
      }

      if (!transaction.canBeRefunded()) {
        throw new Error('Transaction cannot be refunded (outside 90-day window)');
      }

      // Create refund record
      const refundId = `REF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const refund = new Refund({
        refundId,
        transactionId: transaction._id,
        userId: transaction.userId,
        originalAmount: transaction.amount,
        refundAmount: refundAmount || transaction.amount,
        currency: transaction.currency,
        reason,
        reasonDescription,
        gateway: transaction.gateway,
        status: 'requested',
      });

      await refund.save();

      // Update transaction
      transaction.refundStatus = 'requested';
      transaction.refundReason = reason;
      transaction.refundRequestedAt = new Date();
      await transaction.save();

      return {
        success: true,
        refundId,
        status: 'requested',
      };
    } catch (error) {
      console.error('Refund request error:', error);
      throw new Error(`Failed to request refund: ${error.message}`);
    }
  }

  /**
   * Process refund (admin)
   */
  async processRefund(refundId, adminId, action = 'approve', notes = null) {
    try {
      const refund = await Refund.findOne({ refundId });

      if (!refund) {
        throw new Error('Refund not found');
      }

      if (action === 'approve') {
        await refund.approve(adminId, notes);

        // Process refund with gateway
        const transaction = await Transaction.findById(refund.transactionId);
        const gateway = this.getGateway(transaction.gateway);

        try {
          const refundResult = await gateway.refundPayment(
            transaction.gatewayTransactionId,
            refund.refundAmount,
            refund.reason
          );

          refund.gatewayRefundId = refundResult.refundId;
          await refund.markProcessing(adminId, 'Refund processing with gateway');
        } catch (error) {
          console.error('Gateway refund error:', error);
          await refund.markProcessing(adminId, `Gateway refund initiated: ${error.message}`);
        }
      } else if (action === 'reject') {
        await refund.reject(adminId, notes);
      }

      return {
        success: true,
        refund: refund.toObject(),
      };
    } catch (error) {
      console.error('Process refund error:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Add amount to user wallet
   */
  async addToWallet(userId, amount) {
    try {
      let wallet = await Wallet.findOne({ userId });

      if (!wallet) {
        wallet = new Wallet({ userId });
      }

      await wallet.addBalance(amount, 'Payment received');

      return wallet;
    } catch (error) {
      console.error('Add to wallet error:', error);
      throw error;
    }
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const transactions = await Transaction.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Transaction.countDocuments({ userId });

      return {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get transaction history error:', error);
      throw error;
    }
  }

  /**
   * Get refund history
   */
  async getRefundHistory(userId, page = 1, limit = 20) {
    try {
      const skip = (page - 1) * limit;

      const refunds = await Refund.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean();

      const total = await Refund.countDocuments({ userId });

      return {
        refunds,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Get refund history error:', error);
      throw error;
    }
  }

  /**
   * Get gateway health status
   */
  async getGatewayStatus() {
    try {
      const status = {};

      for (const [name, gateway] of Object.entries(this.gateways)) {
        status[name] = await gateway.getHealthStatus();
      }

      return status;
    } catch (error) {
      console.error('Get gateway status error:', error);
      throw error;
    }
  }
}

export default new PaymentService();
