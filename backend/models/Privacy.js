import mongoose from 'mongoose';

const privacySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    profileVisibility: {
      type: String,
      enum: ['Public', 'Friends', 'Private'],
      default: 'Public',
    },
    allowMessagesFrom: {
      type: String,
      enum: ['Everyone', 'Friends', 'Nobody'],
      default: 'Everyone',
    },
    allowFriendRequests: {
      type: Boolean,
      default: true,
    },
    showOnlineStatus: {
      type: Boolean,
      default: true,
    },
    showLastSeen: {
      type: Boolean,
      default: true,
    },
    showActivity: {
      type: Boolean,
      default: true,
    },
    blockedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    mutedUsers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    allowTagging: {
      type: Boolean,
      default: true,
    },
    allowComments: {
      type: String,
      enum: ['Everyone', 'Friends', 'Nobody'],
      default: 'Everyone',
    },
    dataCollection: {
      type: Boolean,
      default: true,
    },
    marketingEmails: {
      type: Boolean,
      default: true,
    },
    notificationSettings: {
      likes: { type: Boolean, default: true },
      comments: { type: Boolean, default: true },
      messages: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      mentions: { type: Boolean, default: true },
      follows: { type: Boolean, default: true },
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    twoFactorMethod: {
      type: String,
      enum: ['SMS', 'Email', 'Authenticator'],
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

export default mongoose.model('Privacy', privacySchema);
