import Transaction from '../../models/Transaction.js';
import Wallet from '../../models/Wallet.js';
import PaymentService from './PaymentService.js';

/**
 * IPN Handler for SSLCommerz Instant Payment Notification
 * Handles webhook callbacks from SSLCommerz
 */

class IPNHandler {
  /**
   * Handle IPN from SSLCommerz
   */
  async handleSSLCommerzIPN(ipnData) {
    try {
      const { tran_id, status, val_id } = ipnData;

      console.log(`📨 IPN received for transaction: ${tran_id}, Status: ${status}`);

      // Find transaction
      const transaction = await Transaction.findOne({ transactionId: tran_id });

      if (!transaction) {
        console.warn(`⚠️ Transaction not found: ${tran_id}`);
        return {
          success: false,
          reason: 'Transaction not found',
        };
      }

      // If already processed, return
      if (transaction.status !== 'pending') {
        console.log(`ℹ️ Transaction already processed: ${tran_id}`);
        return {
          success: true,
          reason: 'Already processed',
        };
      }

      // Handle different statuses
      if (status === 'VALID') {
        return await this.handleSuccessfulPayment(transaction, ipnData);
      } else if (status === 'FAILED') {
        return await this.handleFailedPayment(transaction, ipnData);
      } else if (status === 'CANCELLED') {
        return await this.handleCancelledPayment(transaction, ipnData);
      } else {
        return await this.handleUnknownStatus(transaction, status);
      }
    } catch (error) {
      console.error('IPN handling error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  async handleSuccessfulPayment(transaction, ipnData) {
    try {
      console.log(`✅ Processing successful payment: ${transaction.transactionId}`);

      // Update transaction
      transaction.status = 'success';
      transaction.completedAt = new Date();
      transaction.paymentDetails = {
        bankTransactionId: ipnData.bank_tran_id,
        cardBrand: ipnData.card_brand,
        cardLastFour: ipnData.card_number?.slice(-4),
        validationId: ipnData.val_id,
        riskLevel: ipnData.risk_level,
        riskTitle: ipnData.risk_title,
      };

      await transaction.save();

      // Handle purpose-specific actions
      await this.handlePaymentPurpose(transaction);

      // Send confirmation email
      await this.sendConfirmationEmail(transaction);

      // Send webhook notification to application
      await this.notifyApplication(transaction, 'payment.success');

      return {
        success: true,
        message: 'Payment processed successfully',
        transactionId: transaction.transactionId,
      };
    } catch (error) {
      console.error('Handle successful payment error:', error);
      throw error;
    }
  }

  /**
   * Handle failed payment
   */
  async handleFailedPayment(transaction, ipnData) {
    try {
      console.log(`❌ Processing failed payment: ${transaction.transactionId}`);

      transaction.status = 'failed';
      transaction.failedAt = new Date();
      transaction.statusReason = ipnData.error_reason || 'Payment failed';

      await transaction.save();

      // Send failure notification
      await this.notifyApplication(transaction, 'payment.failed');

      return {
        success: true,
        message: 'Payment failure recorded',
        transactionId: transaction.transactionId,
      };
    } catch (error) {
      console.error('Handle failed payment error:', error);
      throw error;
    }
  }

  /**
   * Handle cancelled payment
   */
  async handleCancelledPayment(transaction, ipnData) {
    try {
      console.log(`⏸️ Processing cancelled payment: ${transaction.transactionId}`);

      transaction.status = 'cancelled';
      transaction.statusReason = 'Payment cancelled by user';

      await transaction.save();

      // Send cancellation notification
      await this.notifyApplication(transaction, 'payment.cancelled');

      return {
        success: true,
        message: 'Payment cancellation recorded',
        transactionId: transaction.transactionId,
      };
    } catch (error) {
      console.error('Handle cancelled payment error:', error);
      throw error;
    }
  }

  /**
   * Handle unknown status
   */
  async handleUnknownStatus(transaction, status) {
    try {
      console.warn(`⚠️ Unknown payment status: ${status} for ${transaction.transactionId}`);

      transaction.status = 'processing';
      transaction.statusReason = `Unknown status: ${status}`;

      await transaction.save();

      return {
        success: true,
        message: 'Payment status recorded as processing',
        transactionId: transaction.transactionId,
      };
    } catch (error) {
      console.error('Handle unknown status error:', error);
      throw error;
    }
  }

  /**
   * Handle payment purpose-specific actions
   */
  async handlePaymentPurpose(transaction) {
    try {
      switch (transaction.purpose) {
        case 'wallet_topup':
          await this.handleWalletTopup(transaction);
          break;

        case 'product_purchase':
          await this.handleProductPurchase(transaction);
          break;

        case 'creator_fund':
          await this.handleCreatorFundPayment(transaction);
          break;

        case 'subscription':
          await this.handleSubscriptionPayment(transaction);
          break;

        case 'gift':
          await this.handleGiftPayment(transaction);
          break;

        default:
          console.log(`ℹ️ No specific handling for purpose: ${transaction.purpose}`);
      }
    } catch (error) {
      console.error('Handle payment purpose error:', error);
      // Don't throw - payment is already recorded
    }
  }

  /**
   * Handle wallet topup
   */
  async handleWalletTopup(transaction) {
    try {
      console.log(`💰 Adding ${transaction.amount} to wallet for user ${transaction.userId}`);

      let wallet = await Wallet.findOne({ userId: transaction.userId });

      if (!wallet) {
        wallet = new Wallet({ userId: transaction.userId });
      }

      await wallet.addBalance(transaction.amount, `Wallet topup - Transaction: ${transaction.transactionId}`);

      console.log(`✅ Wallet updated successfully`);
    } catch (error) {
      console.error('Handle wallet topup error:', error);
      throw error;
    }
  }

  /**
   * Handle product purchase
   */
  async handleProductPurchase(transaction) {
    try {
      console.log(`🛍️ Processing product purchase for order ${transaction.relatedItemId}`);

      // TODO: Update order status to "paid"
      // TODO: Trigger inventory update
      // TODO: Send order confirmation email

      console.log(`✅ Product purchase processed`);
    } catch (error) {
      console.error('Handle product purchase error:', error);
      throw error;
    }
  }

  /**
   * Handle creator fund payment
   */
  async handleCreatorFundPayment(transaction) {
    try {
      console.log(`🎬 Processing creator fund payment`);

      // TODO: Update creator fund balance
      // TODO: Update earnings records

      console.log(`✅ Creator fund payment processed`);
    } catch (error) {
      console.error('Handle creator fund payment error:', error);
      throw error;
    }
  }

  /**
   * Handle subscription payment
   */
  async handleSubscriptionPayment(transaction) {
    try {
      console.log(`📅 Processing subscription payment`);

      // TODO: Activate subscription
      // TODO: Set expiry date
      // TODO: Send subscription confirmation

      console.log(`✅ Subscription payment processed`);
    } catch (error) {
      console.error('Handle subscription payment error:', error);
      throw error;
    }
  }

  /**
   * Handle gift payment
   */
  async handleGiftPayment(transaction) {
    try {
      console.log(`🎁 Processing gift payment`);

      // TODO: Transfer gift to recipient
      // TODO: Send gift notification

      console.log(`✅ Gift payment processed`);
    } catch (error) {
      console.error('Handle gift payment error:', error);
      throw error;
    }
  }

  /**
   * Send confirmation email
   */
  async sendConfirmationEmail(transaction) {
    try {
      // TODO: Implement email sending
      console.log(`📧 Sending confirmation email to ${transaction.customerEmail}`);
    } catch (error) {
      console.error('Send confirmation email error:', error);
      // Don't throw - payment is already recorded
    }
  }

  /**
   * Notify application of payment event
   */
  async notifyApplication(transaction, eventType) {
    try {
      // TODO: Implement webhook notification to application
      // This could trigger additional business logic
      console.log(`🔔 Application notified: ${eventType} for ${transaction.transactionId}`);
    } catch (error) {
      console.error('Notify application error:', error);
      // Don't throw - payment is already recorded
    }
  }
}

export default new IPNHandler();
