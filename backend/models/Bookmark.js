import mongoose from 'mongoose';

const bookmarkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collectionName: {
      type: String,
      required: true,
      default: 'Saved',
      trim: true,
    },
    collectionDescription: {
      type: String,
      trim: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    items: [
      {
        contentType: {
          type: String,
          enum: ['Post', 'Video', 'Reel', 'Story', 'Music'],
          required: true,
        },
        contentId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          refPath: 'items.contentType',
        },
        savedAt: {
          type: Date,
          default: Date.now,
        },
        note: {
          type: String,
          trim: true,
        },
      },
    ],
    itemCount: {
      type: Number,
      default: 0,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
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

export default mongoose.model('Bookmark', bookmarkSchema);
