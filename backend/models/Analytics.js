import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    totalViews: {
      type: Number,
      default: 0,
    },
    totalLikes: {
      type: Number,
      default: 0,
    },
    totalComments: {
      type: Number,
      default: 0,
    },
    totalShares: {
      type: Number,
      default: 0,
    },
    totalFollowers: {
      type: Number,
      default: 0,
    },
    totalFollowing: {
      type: Number,
      default: 0,
    },
    engagementRate: {
      type: Number,
      default: 0,
    },
    topPosts: [
      {
        postId: mongoose.Schema.Types.ObjectId,
        views: Number,
        likes: Number,
        comments: Number,
      },
    ],
    topVideos: [
      {
        videoId: mongoose.Schema.Types.ObjectId,
        views: Number,
        likes: Number,
        comments: Number,
      },
    ],
    dailyStats: [
      {
        date: Date,
        views: Number,
        likes: Number,
        comments: Number,
        followers: Number,
      },
    ],
    monthlyStats: [
      {
        month: String,
        views: Number,
        likes: Number,
        comments: Number,
        followers: Number,
      },
    ],
    audienceDemographics: {
      ageGroups: {
        '13-18': Number,
        '19-24': Number,
        '25-34': Number,
        '35-44': Number,
        '45-54': Number,
        '55+': Number,
      },
      gender: {
        male: Number,
        female: Number,
        other: Number,
      },
      countries: [
        {
          country: String,
          count: Number,
        },
      ],
    },
    earnings: {
      totalEarnings: { type: Number, default: 0 },
      thisMonth: { type: Number, default: 0 },
      thisYear: { type: Number, default: 0 },
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Analytics', analyticsSchema);
