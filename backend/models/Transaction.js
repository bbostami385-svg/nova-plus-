import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    // Transaction Identifiers
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Payment Details
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'INR'],
    },
    paymentMethod: {
      type: String,
      enum: ['bkash', 'nagad', 'rocket', 'card', 'stripe', 'other'],
      required: true,
    },

    // Payment Gateway
    gateway: {
      type: String,
      enum: ['sslcommerz', 'stripe', 'other'],
      default: 'sslcommerz',
      index: true,
    },
    gatewayTransactionId: {
      type: String,
      index: true,
    },

    // Transaction Status
    status: {
      type: String,
      enum: ['pending', 'processing', 'success', 'failed', 'cancelled', 'refunded'],
      default: 'pending',
      index: true,
    },
    statusReason: String,

    // Purpose of Payment
    purpose: {
      type: String,
      enum: ['product_purchase', 'creator_fund', 'subscription', 'gift', 'wallet_topup', 'other'],
      required: true,
    },
    relatedItemId: mongoose.Schema.Types.ObjectId, // productId, orderId, etc.
    relatedItemType: String, // 'Product', 'Order', 'Subscription', etc.

    // Customer Information
    customerEmail: String,
    customerPhone: String,
    customerName: String,

    // Payment Details from Gateway
    paymentDetails: {
      bankName: String,
      cardBrand: String,
      cardLastFour: String,
      bankTransactionId: String,
      validationId: String, // SSLCommerz validation ID
      riskLevel: String,
      riskTitle: String,
    },

    // Billing & Shipping
    billingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    // Refund Information
    refundStatus: {
      type: String,
      enum: ['none', 'requested', 'processing', 'completed', 'failed'],
      default: 'none',
    },
    refundAmount: {
      type: Number,
      default: 0,
    },
    refundReason: String,
    refundRequestedAt: Date,
    refundCompletedAt: Date,
    refundTransactionId: String,

    // Metadata
    description: String,
    notes: String,
    metadata: {
      type: Map,
      of: String,
    },

    // Timestamps
    initiatedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
    failedAt: Date,

    // Retry Information
    retryCount: {
      type: Number,
      default: 0,
    },
    lastRetryAt: Date,

    // IP & Device Info
    ipAddress: String,
    userAgent: String,
    deviceInfo: String,
  },
  { timestamps: true }
);

// Indexes for faster queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ gateway: 1, status: 1 });
transactionSchema.index({ gatewayTransactionId: 1 });
transactionSchema.index({ purpose: 1, status: 1 });

// Virtual for transaction age
transactionSchema.virtual('ageInMinutes').get(function () {
  return Math.floor((Date.now() - this.initiatedAt) / 60000);
});

// Method to check if transaction can be refunded
transactionSchema.methods.canBeRefunded = function () {
  return (
    this.status === 'success' &&
    this.refundStatus === 'none' &&
    Date.now() - this.completedAt < 90 * 24 * 60 * 60 * 1000 // 90 days
  );
};

// Method to update status
transactionSchema.methods.updateStatus = async function (newStatus, reason = null) {
  this.status = newStatus;
  if (reason) {
    this.statusReason = reason;
  }

  if (newStatus === 'success') {
    this.completedAt = new Date();
  } else if (newStatus === 'failed') {
    this.failedAt = new Date();
  }

  return this.save();
};

export default mongoose.model('Transaction', transactionSchema);
