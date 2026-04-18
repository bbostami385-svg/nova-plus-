const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // Payment Reference
    paymentId: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    stripePaymentIntentId: {
      type: String,
      unique: true,
      sparse: true,
    },
    stripeCustomerId: String,

    // User Information
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Order Reference
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },

    // Amount Information
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    amountRefunded: {
      type: Number,
      default: 0,
    },

    // Payment Method
    paymentMethod: {
      type: String,
      enum: ['card', 'bank_account', 'wallet', 'paypal', 'other'],
      required: true,
    },
    cardDetails: {
      last4: String,
      brand: String, // visa, mastercard, amex, etc.
      expiryMonth: Number,
      expiryYear: Number,
      fingerprint: String,
    },

    // Payment Status
    status: {
      type: String,
      enum: [
        'pending',
        'processing',
        'succeeded',
        'failed',
        'canceled',
        'requires_action',
        'refunded',
        'partially_refunded',
      ],
      default: 'pending',
      index: true,
    },

    // Refund Information
    refunds: [
      {
        refundId: String,
        stripeRefundId: String,
        amount: Number,
        reason: {
          type: String,
          enum: ['requested_by_customer', 'duplicate', 'fraudulent', 'other'],
        },
        status: {
          type: String,
          enum: ['pending', 'succeeded', 'failed'],
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // Dispute Information
    dispute: {
      stripeDisputeId: String,
      reason: String,
      status: String,
      amount: Number,
      createdAt: Date,
    },

    // Metadata
    description: String,
    metadata: mongoose.Schema.Types.Mixed,

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    processedAt: Date,
    failedAt: Date,
    failureReason: String,
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
paymentSchema.index({ userId: 1, createdAt: -1 });
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ stripePaymentIntentId: 1 });

// Virtual for total refunded
paymentSchema.virtual('totalRefunded').get(function () {
  return this.refunds.reduce((sum, refund) => {
    if (refund.status === 'succeeded') {
      return sum + refund.amount;
    }
    return sum;
  }, 0);
});

module.exports = mongoose.model('Payment', paymentSchema);
