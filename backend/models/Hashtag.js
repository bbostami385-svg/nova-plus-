import mongoose from 'mongoose';

const hashtagSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    icon: {
      type: String,
    },
    category: {
      type: String,
      enum: ['Trending', 'Popular', 'Emerging', 'Niche'],
      default: 'Emerging',
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post',
      },
    ],
    videos: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    reels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reel',
      },
    ],
    usageCount: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    trendingScore: {
      type: Number,
      default: 0,
    },
    isTrending: {
      type: Boolean,
      default: false,
    },
    trendingRank: {
      type: Number,
    },
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

// Index for trending queries
hashtagSchema.index({ isTrending: 1, trendingRank: 1 });
hashtagSchema.index({ usageCount: -1 });
hashtagSchema.index({ createdAt: -1 });

export default mongoose.model('Hashtag', hashtagSchema);
