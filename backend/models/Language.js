import mongoose from 'mongoose';

const languageSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: true,
    },
    nativeName: {
      type: String,
      required: true,
    },
    flag: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    translations: {
      type: Map,
      of: String,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Language', languageSchema);
