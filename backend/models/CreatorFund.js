import mongoose from 'mongoose';

const creatorFundSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },

    // Account Status
    status: {
      type: String,
      enum: ['pending', 'approved', 'suspended', 'inactive'],
      default: 'pending',
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'verified', 'rejected'],
      default: 'pending',
    },
    verifiedAt: Date,

    // Earnings
    totalEarnings: {
      type: Number,
      default: 0,
    },
    monthlyEarnings: {
      type: Number,
      default: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
    },
    withdrawnAmount: {
      type: Number,
      default: 0,
    },

    // Earnings Breakdown
    earningsBreakdown: {
      postRevenue: { type: Number, default: 0 },
      videoRevenue: { type: Number, default: 0 },
      sponsorshipRevenue: { type: Number, default: 0 },
      giftRevenue: { type: Number, default: 0 },
      affiliateRevenue: { type: Number, default: 0 },
    },

    // Performance Metrics
    metrics: {
      totalViews: { type: Number, default: 0 },
      totalEngagement: { type: Number, default: 0 },
      averageEngagementRate: { type: Number, default: 0 },
      followerCount: { type: Number, default: 0 },
      videoCount: { type: Number, default: 0 },
      postCount: { type: Number, default: 0 },
    },

    // Payout Information
    payoutMethod: {
      type: String,
      enum: ['bank_transfer', 'paypal', 'stripe', 'wallet'],
    },
    payoutDetails: {
      accountHolderName: String,
      accountNumber: String,
      routingNumber: String,
      bankName: String,
      paypalEmail: String,
      stripeAccountId: String,
    },

    // Payout History
    payouts: [
      {
        payoutId: String,
        amount: Number,
        status: {
          type: String,
          enum: ['pending', 'processing', 'completed', 'failed'],
        },
        method: String,
        requestedAt: Date,
        processedAt: Date,
        failureReason: String,
      },
    ],

    // Tier Information
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    tierQualifications: {
      minFollowers: { type: Number, default: 0 },
      minEngagementRate: { type: Number, default: 0 },
      minMonthlyViews: { type: Number, default: 0 },
    },

    // Commission Rates
    commissionRates: {
      postRevenue: { type: Number, default: 0.5 }, // 50%
      videoRevenue: { type: Number, default: 0.55 }, // 55%
      sponsorshipRevenue: { type: Number, default: 0.7 }, // 70%
      giftRevenue: { type: Number, default: 0.5 }, // 50%
    },

    // Tax Information
    taxInfo: {
      taxId: String,
      taxCountry: String,
      taxFilingStatus: {
        type: String,
        enum: ['not_required', 'pending', 'filed', 'verified'],
      },
    },

    // Documents
    documents: [
      {
        type: String,
        enum: ['id_verification', 'tax_form', 'bank_verification'],
        url: String,
        uploadedAt: Date,
        status: String,
      },
    ],

    // Settings
    settings: {
      autoWithdrawal: { type: Boolean, default: false },
      autoWithdrawalThreshold: { type: Number, default: 100 },
      emailNotifications: { type: Boolean, default: true },
      withdrawalFrequency: {
        type: String,
        enum: ['weekly', 'monthly', 'quarterly'],
        default: 'monthly',
      },
    },

    // Metadata
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Indexes
creatorFundSchema.index({ creatorId: 1 });
creatorFundSchema.index({ status: 1 });
creatorFundSchema.index({ tier: 1 });
creatorFundSchema.index({ totalEarnings: -1 });

export default mongoose.model('CreatorFund', creatorFundSchema);
