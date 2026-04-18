import Analytics from '../models/Analytics.js';
import Post from '../models/Post.js';

class AnalyticsService {
  // Track view
  async trackView(creatorId, contentId, contentType, viewerData = {}) {
    try {
      let analytics = await Analytics.findOne({ contentId, contentType });

      if (!analytics) {
        analytics = new Analytics({
          creatorId,
          contentId,
          contentType,
          startDate: new Date(),
          endDate: new Date(),
        });
      }

      // Increment total views
      analytics.views.total += 1;

      // Track by day
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const dayRecord = analytics.views.byDay.find(
        (d) => d.date.toDateString() === today.toDateString()
      );

      if (dayRecord) {
        dayRecord.count += 1;
      } else {
        analytics.views.byDay.push({
          date: today,
          count: 1,
        });
      }

      // Update audience demographics
      if (viewerData.country) {
        const countryRecord = analytics.demographics.topCountries.find(
          (c) => c.country === viewerData.country
        );
        if (countryRecord) {
          countryRecord.count += 1;
        } else {
          analytics.demographics.topCountries.push({
            country: viewerData.country,
            count: 1,
          });
        }
      }

      if (viewerData.ageGroup) {
        analytics.demographics.ageGroups[viewerData.ageGroup] += 1;
      }

      if (viewerData.gender) {
        analytics.demographics.gender[viewerData.gender] += 1;
      }

      if (viewerData.device) {
        analytics.devices[viewerData.device] += 1;
      }

      await analytics.save();
      return analytics;
    } catch (error) {
      throw new Error(`Failed to track view: ${error.message}`);
    }
  }

  // Track engagement
  async trackEngagement(contentId, contentType, engagementType, count = 1) {
    try {
      const analytics = await Analytics.findOne({ contentId, contentType });

      if (!analytics) {
        throw new Error('Analytics record not found');
      }

      if (engagementType === 'like') {
        analytics.engagement.likes += count;
      } else if (engagementType === 'comment') {
        analytics.engagement.comments += count;
      } else if (engagementType === 'share') {
        analytics.engagement.shares += count;
      } else if (engagementType === 'save') {
        analytics.engagement.saves += count;
      } else if (engagementType === 'click') {
        analytics.engagement.clicks += count;
      }

      // Calculate engagement rate
      if (analytics.views.total > 0) {
        const totalEngagement =
          analytics.engagement.likes +
          analytics.engagement.comments +
          analytics.engagement.shares +
          analytics.engagement.saves;
        analytics.audience.engagementRate =
          (totalEngagement / analytics.views.total) * 100;
      }

      await analytics.save();
      return analytics;
    } catch (error) {
      throw new Error(`Failed to track engagement: ${error.message}`);
    }
  }

  // Get content analytics
  async getContentAnalytics(contentId, contentType) {
    try {
      const analytics = await Analytics.findOne({ contentId, contentType });

      if (!analytics) {
        throw new Error('Analytics record not found');
      }

      return analytics;
    } catch (error) {
      throw new Error(`Failed to fetch content analytics: ${error.message}`);
    }
  }

  // Get creator analytics
  async getCreatorAnalytics(creatorId, period = 'monthly') {
    try {
      const analytics = await Analytics.find({
        creatorId,
        period,
      }).sort({ startDate: -1 });

      if (analytics.length === 0) {
        throw new Error('No analytics found for this creator');
      }

      // Calculate aggregated metrics
      const aggregated = {
        totalViews: 0,
        totalEngagement: 0,
        totalReach: 0,
        averageEngagementRate: 0,
        topContent: [],
      };

      analytics.forEach((record) => {
        aggregated.totalViews += record.views.total;
        aggregated.totalEngagement +=
          record.engagement.likes +
          record.engagement.comments +
          record.engagement.shares +
          record.engagement.saves;
        aggregated.totalReach += record.audience.totalReach;
      });

      aggregated.averageEngagementRate =
        aggregated.totalViews > 0
          ? (aggregated.totalEngagement / aggregated.totalViews) * 100
          : 0;

      // Get top content
      aggregated.topContent = analytics
        .sort((a, b) => b.views.total - a.views.total)
        .slice(0, 5);

      return {
        aggregated,
        detailedAnalytics: analytics,
      };
    } catch (error) {
      throw new Error(`Failed to fetch creator analytics: ${error.message}`);
    }
  }

  // Get audience demographics
  async getAudienceDemographics(creatorId) {
    try {
      const analytics = await Analytics.find({ creatorId });

      if (analytics.length === 0) {
        throw new Error('No analytics found');
      }

      // Aggregate demographics
      const demographics = {
        ageGroups: {
          '13-17': 0,
          '18-24': 0,
          '25-34': 0,
          '35-44': 0,
          '45-54': 0,
          '55+': 0,
        },
        gender: {
          male: 0,
          female: 0,
          other: 0,
        },
        topCountries: [],
        topCities: [],
      };

      analytics.forEach((record) => {
        Object.keys(demographics.ageGroups).forEach((group) => {
          demographics.ageGroups[group] += record.demographics.ageGroups[group];
        });

        Object.keys(demographics.gender).forEach((gender) => {
          demographics.gender[gender] += record.demographics.gender[gender];
        });

        demographics.topCountries.push(...record.demographics.topCountries);
        demographics.topCities.push(...record.demographics.topCities);
      });

      // Sort and deduplicate countries and cities
      demographics.topCountries = demographics.topCountries
        .reduce((acc, item) => {
          const existing = acc.find((a) => a.country === item.country);
          if (existing) {
            existing.count += item.count;
          } else {
            acc.push(item);
          }
          return acc;
        }, [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      demographics.topCities = demographics.topCities
        .reduce((acc, item) => {
          const existing = acc.find((a) => a.city === item.city);
          if (existing) {
            existing.count += item.count;
          } else {
            acc.push(item);
          }
          return acc;
        }, [])
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return demographics;
    } catch (error) {
      throw new Error(`Failed to fetch audience demographics: ${error.message}`);
    }
  }

  // Get trending content
  async getTrendingContent(limit = 10) {
    try {
      const analytics = await Analytics.find()
        .sort({ 'views.total': -1 })
        .limit(limit)
        .populate('contentId', 'title description')
        .lean();

      return analytics;
    } catch (error) {
      throw new Error(`Failed to fetch trending content: ${error.message}`);
    }
  }

  // Generate performance report
  async generatePerformanceReport(creatorId, startDate, endDate) {
    try {
      const analytics = await Analytics.find({
        creatorId,
        startDate: { $gte: startDate },
        endDate: { $lte: endDate },
      });

      if (analytics.length === 0) {
        throw new Error('No analytics data for this period');
      }

      const report = {
        period: {
          startDate,
          endDate,
        },
        summary: {
          totalViews: 0,
          totalEngagement: 0,
          totalReach: 0,
          averageEngagementRate: 0,
          contentCount: analytics.length,
        },
        contentBreakdown: {
          byType: {},
          topPerformers: [],
        },
        audienceInsights: {},
        recommendations: [],
      };

      analytics.forEach((record) => {
        report.summary.totalViews += record.views.total;
        report.summary.totalEngagement +=
          record.engagement.likes +
          record.engagement.comments +
          record.engagement.shares +
          record.engagement.saves;
        report.summary.totalReach += record.audience.totalReach;

        // Breakdown by type
        if (!report.contentBreakdown.byType[record.contentType]) {
          report.contentBreakdown.byType[record.contentType] = {
            count: 0,
            views: 0,
            engagement: 0,
          };
        }

        report.contentBreakdown.byType[record.contentType].count += 1;
        report.contentBreakdown.byType[record.contentType].views += record.views.total;
        report.contentBreakdown.byType[record.contentType].engagement +=
          record.engagement.likes +
          record.engagement.comments +
          record.engagement.shares +
          record.engagement.saves;
      });

      report.summary.averageEngagementRate =
        report.summary.totalViews > 0
          ? (report.summary.totalEngagement / report.summary.totalViews) * 100
          : 0;

      // Get top performers
      report.contentBreakdown.topPerformers = analytics
        .sort((a, b) => b.views.total - a.views.total)
        .slice(0, 5)
        .map((a) => ({
          contentId: a.contentId,
          contentType: a.contentType,
          views: a.views.total,
          engagement: a.engagement,
        }));

      // Generate recommendations
      if (report.summary.averageEngagementRate < 2) {
        report.recommendations.push('Consider improving content quality and relevance');
      }
      if (report.contentBreakdown.byType.video?.views > report.contentBreakdown.byType.post?.views) {
        report.recommendations.push('Videos are performing better - focus on video content');
      }

      return report;
    } catch (error) {
      throw new Error(`Failed to generate performance report: ${error.message}`);
    }
  }

  // Track revenue
  async trackRevenue(contentId, contentType, revenueData) {
    try {
      const analytics = await Analytics.findOne({ contentId, contentType });

      if (!analytics) {
        throw new Error('Analytics record not found');
      }

      analytics.revenue.adRevenue += revenueData.adRevenue || 0;
      analytics.revenue.sponsorshipRevenue += revenueData.sponsorshipRevenue || 0;
      analytics.revenue.giftRevenue += revenueData.giftRevenue || 0;
      analytics.revenue.total =
        analytics.revenue.adRevenue +
        analytics.revenue.sponsorshipRevenue +
        analytics.revenue.giftRevenue;

      await analytics.save();
      return analytics;
    } catch (error) {
      throw new Error(`Failed to track revenue: ${error.message}`);
    }
  }
}

export default new AnalyticsService();
