import mongoose from 'mongoose';

const sponsorshipSchema = new mongoose.Schema(
  {
    creatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    brandName: {
      type: String,
      required: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Fashion', 'Technology', 'Beauty', 'Food', 'Travel', 'Fitness', 'Entertainment', 'Other'],
      required: true,
    },
    budget: {
      type: Number,
      required: true,
    },
    deliverables: [
      {
        type: String,
        trim: true,
      },
    ],
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Active', 'Completed', 'Cancelled'],
      default: 'Pending',
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Partial', 'Completed'],
      default: 'Pending',
    },
    content: [
      {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'contentType',
      },
    ],
    contentType: {
      type: String,
      enum: ['Post', 'Video', 'Reel', 'Story'],
    },
    engagement: {
      views: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
    },
    roi: {
      type: Number,
      default: 0,
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

export default mongoose.model('Sponsorship', sponsorshipSchema);
