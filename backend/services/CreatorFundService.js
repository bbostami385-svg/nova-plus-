import CreatorFund from '../models/CreatorFund.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';

class CreatorFundService {
  // Initialize creator fund account
  async initializeCreatorFund(creatorId) {
    try {
      const existingFund = await CreatorFund.findOne({ creatorId });
      if (existingFund) {
        throw new Error('Creator fund already exists');
      }

      const fund = new CreatorFund({
        creatorId,
        status: 'pending',
        verificationStatus: 'pending',
      });

      await fund.save();
      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to initialize creator fund: ${error.message}`);
    }
  }

  // Get creator fund details
  async getCreatorFund(creatorId) {
    try {
      const fund = await CreatorFund.findOne({ creatorId }).populate(
        'creatorId',
        'username profilePicture email'
      );

      if (!fund) {
        throw new Error('Creator fund not found');
      }

      return fund;
    } catch (error) {
      throw new Error(`Failed to fetch creator fund: ${error.message}`);
    }
  }

  // Update payout method
  async updatePayoutMethod(creatorId, payoutMethod, payoutDetails) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      fund.payoutMethod = payoutMethod;
      fund.payoutDetails = payoutDetails;
      await fund.save();

      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to update payout method: ${error.message}`);
    }
  }

  // Add earnings
  async addEarnings(creatorId, amount, source) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      fund.pendingEarnings += amount;
      fund.totalEarnings += amount;
      fund.monthlyEarnings += amount;

      // Update earnings breakdown
      if (source === 'post') {
        fund.earningsBreakdown.postRevenue += amount;
      } else if (source === 'video') {
        fund.earningsBreakdown.videoRevenue += amount;
      } else if (source === 'sponsorship') {
        fund.earningsBreakdown.sponsorshipRevenue += amount;
      } else if (source === 'gift') {
        fund.earningsBreakdown.giftRevenue += amount;
      } else if (source === 'affiliate') {
        fund.earningsBreakdown.affiliateRevenue += amount;
      }

      await fund.save();
      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to add earnings: ${error.message}`);
    }
  }

  // Request payout
  async requestPayout(creatorId, amount) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      if (fund.pendingEarnings < amount) {
        throw new Error('Insufficient pending earnings');
      }

      if (!fund.payoutMethod) {
        throw new Error('Payout method not configured');
      }

      const payoutId = `PAYOUT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const payout = {
        payoutId,
        amount,
        status: 'pending',
        method: fund.payoutMethod,
        requestedAt: new Date(),
      };

      fund.payouts.push(payout);
      fund.pendingEarnings -= amount;

      await fund.save();

      return { success: true, payout, fund };
    } catch (error) {
      throw new Error(`Failed to request payout: ${error.message}`);
    }
  }

  // Process payout
  async processPayout(creatorId, payoutId) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      const payout = fund.payouts.find((p) => p.payoutId === payoutId);
      if (!payout) {
        throw new Error('Payout not found');
      }

      payout.status = 'processing';
      payout.processedAt = new Date();

      fund.withdrawnAmount += payout.amount;

      await fund.save();

      return { success: true, payout, fund };
    } catch (error) {
      throw new Error(`Failed to process payout: ${error.message}`);
    }
  }

  // Complete payout
  async completePayout(creatorId, payoutId) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      const payout = fund.payouts.find((p) => p.payoutId === payoutId);
      if (!payout) {
        throw new Error('Payout not found');
      }

      payout.status = 'completed';
      await fund.save();

      return { success: true, payout, fund };
    } catch (error) {
      throw new Error(`Failed to complete payout: ${error.message}`);
    }
  }

  // Verify creator
  async verifyCreator(creatorId, documents) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      fund.documents = documents;
      fund.verificationStatus = 'pending';
      await fund.save();

      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to verify creator: ${error.message}`);
    }
  }

  // Approve creator
  async approveCreator(creatorId) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      fund.verificationStatus = 'verified';
      fund.status = 'approved';
      fund.verifiedAt = new Date();

      await fund.save();

      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to approve creator: ${error.message}`);
    }
  }

  // Update tier
  async updateTier(creatorId, tier) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      fund.tier = tier;

      // Update commission rates based on tier
      if (tier === 'silver') {
        fund.commissionRates.postRevenue = 0.55;
        fund.commissionRates.videoRevenue = 0.6;
        fund.commissionRates.giftRevenue = 0.55;
      } else if (tier === 'gold') {
        fund.commissionRates.postRevenue = 0.6;
        fund.commissionRates.videoRevenue = 0.65;
        fund.commissionRates.giftRevenue = 0.6;
      } else if (tier === 'platinum') {
        fund.commissionRates.postRevenue = 0.7;
        fund.commissionRates.videoRevenue = 0.75;
        fund.commissionRates.giftRevenue = 0.7;
      }

      await fund.save();

      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to update tier: ${error.message}`);
    }
  }

  // Get creator earnings report
  async getEarningsReport(creatorId, period = 'monthly') {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      const report = {
        period,
        totalEarnings: fund.totalEarnings,
        monthlyEarnings: fund.monthlyEarnings,
        pendingEarnings: fund.pendingEarnings,
        withdrawnAmount: fund.withdrawnAmount,
        earningsBreakdown: fund.earningsBreakdown,
        payouts: fund.payouts,
        metrics: fund.metrics,
      };

      return report;
    } catch (error) {
      throw new Error(`Failed to get earnings report: ${error.message}`);
    }
  }

  // Get top creators
  async getTopCreators(limit = 10) {
    try {
      const creators = await CreatorFund.find({
        status: 'approved',
      })
        .sort({ totalEarnings: -1 })
        .limit(limit)
        .populate('creatorId', 'username profilePicture')
        .lean();

      return creators;
    } catch (error) {
      throw new Error(`Failed to fetch top creators: ${error.message}`);
    }
  }

  // Get creator statistics
  async getCreatorStats(creatorId) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      const stats = {
        totalEarnings: fund.totalEarnings,
        monthlyEarnings: fund.monthlyEarnings,
        pendingEarnings: fund.pendingEarnings,
        withdrawnAmount: fund.withdrawnAmount,
        tier: fund.tier,
        status: fund.status,
        metrics: fund.metrics,
        earningsBreakdown: fund.earningsBreakdown,
        payoutCount: fund.payouts.length,
        completedPayouts: fund.payouts.filter((p) => p.status === 'completed').length,
      };

      return stats;
    } catch (error) {
      throw new Error(`Failed to get creator stats: ${error.message}`);
    }
  }

  // Update metrics
  async updateMetrics(creatorId, metricsData) {
    try {
      const fund = await CreatorFund.findOne({ creatorId });
      if (!fund) {
        throw new Error('Creator fund not found');
      }

      fund.metrics = {
        ...fund.metrics,
        ...metricsData,
      };

      await fund.save();

      return { success: true, fund };
    } catch (error) {
      throw new Error(`Failed to update metrics: ${error.message}`);
    }
  }
}

export default new CreatorFundService();
