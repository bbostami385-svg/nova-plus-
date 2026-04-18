import mongoose from 'mongoose';

const walletSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Balance Information
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'BDT',
      enum: ['BDT', 'USD', 'EUR', 'INR'],
    },

    // Transaction History
    totalDeposited: {
      type: Number,
      default: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
    },
    totalRefunded: {
      type: Number,
      default: 0,
    },

    // Wallet Status
    status: {
      type: String,
      enum: ['active', 'frozen', 'suspended'],
      default: 'active',
    },
    suspensionReason: String,
    suspendedAt: Date,

    // Transaction Limits
    dailyLimit: {
      type: Number,
      default: 100000, // 100,000 BDT
    },
    monthlyLimit: {
      type: Number,
      default: 1000000, // 1,000,000 BDT
    },
    dailySpent: {
      type: Number,
      default: 0,
    },
    monthlySpent: {
      type: Number,
      default: 0,
    },
    lastResetDate: Date,

    // Linked Payment Methods
    linkedPaymentMethods: [
      {
        methodId: String,
        methodType: {
          type: String,
          enum: ['bkash', 'nagad', 'rocket', 'card'],
        },
        identifier: String, // phone number or card last 4 digits
        isDefault: Boolean,
        linkedAt: Date,
      },
    ],

    // Preferences
    autoTopup: {
      enabled: Boolean,
      threshold: Number, // Top up when balance falls below this
      amount: Number, // Amount to top up
    },

    // Metadata
    notes: String,
    tags: [String],

    // Timestamps
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    lastTransactionAt: Date,
  },
  { timestamps: true }
);

// Indexes
walletSchema.index({ userId: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ lastTransactionAt: -1 });

// Method to add balance
walletSchema.methods.addBalance = async function (amount, reason = null) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  this.balance += amount;
  this.totalDeposited += amount;
  this.lastTransactionAt = new Date();

  return this.save();
};

// Method to deduct balance
walletSchema.methods.deductBalance = async function (amount, reason = null) {
  if (amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }

  if (this.balance < amount) {
    throw new Error('Insufficient wallet balance');
  }

  this.balance -= amount;
  this.totalSpent += amount;
  this.dailySpent += amount;
  this.monthlySpent += amount;
  this.lastTransactionAt = new Date();

  return this.save();
};

// Method to check daily limit
walletSchema.methods.canSpendDaily = function (amount) {
  return this.dailySpent + amount <= this.dailyLimit;
};

// Method to check monthly limit
walletSchema.methods.canSpendMonthly = function (amount) {
  return this.monthlySpent + amount <= this.monthlyLimit;
};

// Method to freeze wallet
walletSchema.methods.freeze = async function (reason = null) {
  this.status = 'frozen';
  this.suspensionReason = reason;
  this.suspendedAt = new Date();

  return this.save();
};

// Method to unfreeze wallet
walletSchema.methods.unfreeze = async function () {
  this.status = 'active';
  this.suspensionReason = null;
  this.suspendedAt = null;

  return this.save();
};

// Method to reset daily/monthly limits
walletSchema.methods.resetLimits = async function () {
  const now = new Date();
  const lastReset = this.lastResetDate || new Date(0);

  // Reset daily if it's a new day
  if (now.toDateString() !== lastReset.toDateString()) {
    this.dailySpent = 0;
  }

  // Reset monthly if it's a new month
  if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
    this.monthlySpent = 0;
  }

  this.lastResetDate = now;

  return this.save();
};

export default mongoose.model('Wallet', walletSchema);
