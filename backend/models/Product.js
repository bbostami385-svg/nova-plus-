import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['Electronics', 'Fashion', 'Books', 'Home', 'Sports', 'Toys', 'Beauty', 'Food', 'Other'],
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    discountPrice: {
      type: Number,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    images: [String],
    thumbnail: String,
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    sold: {
      type: Number,
      default: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review',
      },
    ],
    reviewCount: {
      type: Number,
      default: 0,
    },
    tags: [String],
    shipping: {
      type: {
        cost: Number,
        estimatedDays: Number,
        freeShippingAbove: Number,
      },
      default: {
        cost: 0,
        estimatedDays: 3,
        freeShippingAbove: 100,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
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

// Index for marketplace queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ rating: -1, reviewCount: -1 });
productSchema.index({ sellerId: 1, isActive: 1 });

export default mongoose.model('Product', productSchema);
