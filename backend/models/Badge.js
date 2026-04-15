import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      default: '#FFD700',
    },
    points: {
      type: Number,
      default: 10,
    },
    category: {
      type: String,
      enum: ['Social', 'Creator', 'Engagement', 'Milestone', 'Special'],
      required: true,
    },
    requirement: {
      type: String,
      required: true,
    },
    rarity: {
      type: String,
      enum: ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'],
      default: 'Common',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Badge', badgeSchema);
