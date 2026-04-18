import mongoose from 'mongoose';

const refundSchema = new mongoose.Schema(
  {
    // Refund Identifiers
    refundId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      required: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Refund Details
    originalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    refundAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'INR'],
    },

    // Refund Reason
    reason: {
      type: String,
      enum: [
        'customer_request',
        'product_not_received',
        'product_damaged',
        'product_not_as_described',
        'duplicate_charge',
        'unauthorized_transaction',
        'technical_error',
        'other',
      ],
      required: true,
    },
    reasonDescription: String,

    // Refund Status
    status: {
      type: String,
      enum: ['requested', 'approved', 'processing', 'completed', 'rejected', 'cancelled'],
      default: 'requested',
      index: true,
    },
    statusHistory: [
      {
        status: String,
        timestamp: Date,
        notes: String,
        updatedBy: mongoose.Schema.Types.ObjectId,
      },
    ],

    // Processing Information
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Admin user who processed the refund
    },
    processingNotes: String,
    rejectionReason: String,

    // Gateway Information
    gateway: {
      type: String,
      enum: ['sslcommerz', 'stripe', 'manual'],
      required: true,
    },
    gatewayRefundId: String,

    // Refund Method
    refundMethod: {
      type: String,
      enum: ['original_payment_method', 'wallet', 'bank_transfer', 'check'],
      default: 'original_payment_method',
    },
    refundDestination: {
      bankName: String,
      accountNumber: String,
      accountHolder: String,
      routingNumber: String,
    },

    // Timeline
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    approvedAt: Date,
    processedAt: Date,
    completedAt: Date,
    expectedCompletionDate: Date,

    // Attachments & Evidence
    attachments: [
      {
        url: String,
        type: String, // 'image', 'video', 'document'
        uploadedAt: Date,
      },
    ],

    // Metadata
    metadata: {
      type: Map,
      of: String,
    },

    // Dispute Information
    hasDispute: {
      type: Boolean,
      default: false,
    },
    disputeReason: String,
    disputeResolvedAt: Date,

    // Communication
    customerNotes: String,
    adminNotes: String,
    communicationLog: [
      {
        from: String, // 'customer' or 'admin'
        message: String,
        timestamp: Date,
      },
    ],
  },
  { timestamps: true }
);

// Indexes
refundSchema.index({ userId: 1, createdAt: -1 });
refundSchema.index({ status: 1, createdAt: -1 });
refundSchema.index({ transactionId: 1 });
refundSchema.index({ gateway: 1, status: 1 });

// Method to approve refund
refundSchema.methods.approve = async function (adminId, notes = null) {
  this.status = 'approved';
  this.processedBy = adminId;
  this.approvedAt = new Date();
  if (notes) {
    this.processingNotes = notes;
  }

  this.statusHistory.push({
    status: 'approved',
    timestamp: new Date(),
    updatedBy: adminId,
  });

  return this.save();
};

// Method to reject refund
refundSchema.methods.reject = async function (adminId, reason, notes = null) {
  this.status = 'rejected';
  this.processedBy = adminId;
  this.rejectionReason = reason;
  if (notes) {
    this.processingNotes = notes;
  }

  this.statusHistory.push({
    status: 'rejected',
    timestamp: new Date(),
    updatedBy: adminId,
  });

  return this.save();
};

// Method to mark as processing
refundSchema.methods.markProcessing = async function (adminId, notes = null) {
  this.status = 'processing';
  this.processedAt = new Date();
  this.processedBy = adminId;

  if (notes) {
    this.processingNotes = notes;
  }

  this.statusHistory.push({
    status: 'processing',
    timestamp: new Date(),
    updatedBy: adminId,
  });

  return this.save();
};

// Method to mark as completed
refundSchema.methods.markCompleted = async function (adminId, notes = null) {
  this.status = 'completed';
  this.completedAt = new Date();

  if (notes) {
    this.processingNotes = notes;
  }

  this.statusHistory.push({
    status: 'completed',
    timestamp: new Date(),
    updatedBy: adminId,
  });

  return this.save();
};

// Method to add communication log
refundSchema.methods.addCommunication = async function (from, message) {
  this.communicationLog.push({
    from,
    message,
    timestamp: new Date(),
  });

  return this.save();
};

export default mongoose.model('Refund', refundSchema);
