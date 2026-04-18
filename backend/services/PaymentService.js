const Payment = require('../models/Payment');
const Order = require('../models/Order');
const User = require('../models/User');
const crypto = require('crypto');

class PaymentService {
  constructor() {
    // Initialize Stripe (will be configured with API key from env)
    this.stripe = null;
  }

  // Initialize Stripe with API key
  initializeStripe(apiKey) {
    try {
      const stripe = require('stripe');
      this.stripe = stripe(apiKey);
    } catch (error) {
      console.error('Failed to initialize Stripe:', error);
    }
  }

  // Generate unique payment ID
  generatePaymentId() {
    return `PAY-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // Create payment intent
  async createPaymentIntent(userId, orderId, amount, currency = 'usd') {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.buyerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Order does not belong to user');
      }

      // Create Stripe payment intent
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          orderId: orderId.toString(),
          userId: userId.toString(),
        },
      });

      // Create payment record
      const paymentId = this.generatePaymentId();
      const payment = new Payment({
        paymentId,
        userId,
        orderId,
        amount,
        currency,
        paymentMethod: 'card',
        status: 'pending',
        stripePaymentIntentId: paymentIntent.id,
        metadata: {
          stripeIntentId: paymentIntent.id,
        },
      });

      await payment.save();

      return {
        success: true,
        payment,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  // Confirm payment
  async confirmPayment(paymentIntentId, userId) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      // Retrieve payment intent from Stripe
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status !== 'succeeded') {
        throw new Error(`Payment failed with status: ${paymentIntent.status}`);
      }

      // Update payment record
      const payment = await Payment.findOne({ stripePaymentIntentId: paymentIntentId });
      if (!payment) {
        throw new Error('Payment record not found');
      }

      if (payment.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Payment does not belong to user');
      }

      payment.status = 'succeeded';
      payment.processedAt = new Date();

      // Update card details if available
      if (paymentIntent.charges.data[0]) {
        const charge = paymentIntent.charges.data[0];
        const card = charge.payment_method_details?.card;
        if (card) {
          payment.cardDetails = {
            last4: card.last4,
            brand: card.brand,
            expiryMonth: card.exp_month,
            expiryYear: card.exp_year,
            fingerprint: card.fingerprint,
          };
        }
      }

      await payment.save();

      // Update order payment status
      const order = await Order.findById(payment.orderId);
      if (order) {
        order.payment.status = 'completed';
        order.payment.transactionId = paymentIntent.id;
        order.payment.paidAt = new Date();
        order.status = 'confirmed';
        await order.save();
      }

      return { success: true, payment };
    } catch (error) {
      throw new Error(`Failed to confirm payment: ${error.message}`);
    }
  }

  // Process refund
  async processRefund(paymentId, userId, reason) {
    try {
      if (!this.stripe) {
        throw new Error('Stripe not initialized');
      }

      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Payment does not belong to user');
      }

      if (payment.status !== 'succeeded') {
        throw new Error('Can only refund completed payments');
      }

      // Create refund in Stripe
      const refund = await this.stripe.refunds.create({
        payment_intent: payment.stripePaymentIntentId,
        metadata: {
          reason,
        },
      });

      // Record refund
      const refundRecord = {
        refundId: this.generatePaymentId(),
        stripeRefundId: refund.id,
        amount: payment.amount,
        reason,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        createdAt: new Date(),
      };

      payment.refunds.push(refundRecord);
      payment.status = 'refunded';
      payment.amountRefunded = payment.amount;

      await payment.save();

      return { success: true, payment };
    } catch (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  // Get payment by ID
  async getPaymentById(paymentId, userId) {
    try {
      const payment = await Payment.findById(paymentId);
      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Cannot access this payment');
      }

      return payment;
    } catch (error) {
      throw new Error(`Failed to fetch payment: ${error.message}`);
    }
  }

  // Get user's payments
  async getUserPayments(userId, filters = {}) {
    try {
      const query = { userId };

      if (filters.status) {
        query.status = filters.status;
      }

      const skip = (filters.page - 1) * (filters.limit || 20);
      const payments = await Payment.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit || 20)
        .populate('orderId', 'orderId total items')
        .lean();

      const total = await Payment.countDocuments(query);

      return {
        payments,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch user payments: ${error.message}`);
    }
  }

  // Handle webhook event
  async handleWebhookEvent(event) {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
        case 'charge.refunded':
          await this.handleChargeRefunded(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleDisputeCreated(event.data.object);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Failed to handle webhook event:', error);
    }
  }

  // Handle payment succeeded
  async handlePaymentSucceeded(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment && payment.status !== 'succeeded') {
        payment.status = 'succeeded';
        payment.processedAt = new Date();
        await payment.save();

        // Update order
        const order = await Order.findById(payment.orderId);
        if (order) {
          order.payment.status = 'completed';
          order.status = 'confirmed';
          await order.save();
        }
      }
    } catch (error) {
      console.error('Failed to handle payment succeeded:', error);
    }
  }

  // Handle payment failed
  async handlePaymentFailed(paymentIntent) {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: paymentIntent.id,
      });

      if (payment) {
        payment.status = 'failed';
        payment.failedAt = new Date();
        payment.failureReason = paymentIntent.last_payment_error?.message;
        await payment.save();

        // Update order
        const order = await Order.findById(payment.orderId);
        if (order) {
          order.payment.status = 'failed';
          await order.save();
        }
      }
    } catch (error) {
      console.error('Failed to handle payment failed:', error);
    }
  }

  // Handle charge refunded
  async handleChargeRefunded(charge) {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: charge.payment_intent,
      });

      if (payment) {
        payment.status = 'refunded';
        payment.amountRefunded = charge.amount_refunded / 100;
        await payment.save();
      }
    } catch (error) {
      console.error('Failed to handle charge refunded:', error);
    }
  }

  // Handle dispute created
  async handleDisputeCreated(dispute) {
    try {
      const payment = await Payment.findOne({
        stripePaymentIntentId: dispute.payment_intent,
      });

      if (payment) {
        payment.dispute = {
          stripeDisputeId: dispute.id,
          reason: dispute.reason,
          status: dispute.status,
          amount: dispute.amount / 100,
          createdAt: new Date(),
        };
        await payment.save();
      }
    } catch (error) {
      console.error('Failed to handle dispute created:', error);
    }
  }

  // Get payment statistics
  async getPaymentStats(userId) {
    try {
      const payments = await Payment.find({ userId });

      const stats = {
        totalPayments: payments.length,
        totalAmount: 0,
        successfulPayments: 0,
        failedPayments: 0,
        refundedAmount: 0,
        statusBreakdown: {
          pending: 0,
          processing: 0,
          succeeded: 0,
          failed: 0,
          refunded: 0,
        },
      };

      payments.forEach((payment) => {
        stats.totalAmount += payment.amount;
        stats.statusBreakdown[payment.status]++;

        if (payment.status === 'succeeded') {
          stats.successfulPayments++;
        } else if (payment.status === 'failed') {
          stats.failedPayments++;
        }

        if (payment.amountRefunded > 0) {
          stats.refundedAmount += payment.amountRefunded;
        }
      });

      return stats;
    } catch (error) {
      throw new Error(`Failed to get payment stats: ${error.message}`);
    }
  }
}

module.exports = new PaymentService();
