import mongoose from 'mongoose';

const giftSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    giftType: {
      type: String,
      enum: ['Rose', 'Heart', 'Diamond', 'Crown', 'Star', 'Fire', 'Cake', 'Flower'],
      required: true,
    },
    giftName: {
      type: String,
      required: true,
    },
    giftIcon: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      default: 1,
    },
    message: {
      type: String,
      trim: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
    },
    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Video',
    },
    isAnonymous: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Pending', 'Sent', 'Received', 'Claimed'],
      default: 'Sent',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Gift', giftSchema);
