const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const ProductService = require('./ProductService');

class ReviewService {
  // Create a review
  async createReview(userId, productId, orderId, reviewData) {
    try {
      // Verify order exists and belongs to user
      const order = await Order.findById(orderId);
      if (!order || order.buyerId.toString() !== userId.toString()) {
        throw new Error('Order not found or unauthorized');
      }

      // Check if review already exists
      const existingReview = await Review.findOne({ productId, userId, orderId });
      if (existingReview) {
        throw new Error('You have already reviewed this product');
      }

      const review = new Review({
        userId,
        productId,
        orderId,
        ...reviewData,
        isVerifiedPurchase: true,
        purchaseDate: order.createdAt,
      });

      await review.save();

      // Update product rating
      await ProductService.updateProductRating(productId);

      return { success: true, review };
    } catch (error) {
      throw new Error(`Failed to create review: ${error.message}`);
    }
  }

  // Get reviews for a product
  async getProductReviews(productId, filters = {}) {
    try {
      const query = {
        productId,
        status: 'approved',
      };

      const skip = (filters.page - 1) * (filters.limit || 10);
      const sortOption = { createdAt: -1 };

      if (filters.sortBy === 'helpful') {
        sortOption['helpful.count'] = -1;
      } else if (filters.sortBy === 'rating_high') {
        sortOption.rating = -1;
      } else if (filters.sortBy === 'rating_low') {
        sortOption.rating = 1;
      }

      const reviews = await Review.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(filters.limit || 10)
        .populate('userId', 'username profilePicture')
        .lean();

      const total = await Review.countDocuments(query);

      return {
        reviews,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: Math.ceil(total / (filters.limit || 10)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch reviews: ${error.message}`);
    }
  }

  // Get user's reviews
  async getUserReviews(userId, filters = {}) {
    try {
      const skip = (filters.page - 1) * (filters.limit || 10);
      const reviews = await Review.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit || 10)
        .populate('productId', 'title images')
        .lean();

      const total = await Review.countDocuments({ userId });

      return {
        reviews,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 10,
          pages: Math.ceil(total / (filters.limit || 10)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch user reviews: ${error.message}`);
    }
  }

  // Update review
  async updateReview(reviewId, userId, updateData) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }
      if (review.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Only review author can update');
      }

      Object.assign(review, updateData);
      await review.save();

      // Update product rating
      await ProductService.updateProductRating(review.productId);

      return { success: true, review };
    } catch (error) {
      throw new Error(`Failed to update review: ${error.message}`);
    }
  }

  // Delete review
  async deleteReview(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }
      if (review.userId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Only review author can delete');
      }

      const productId = review.productId;
      await Review.findByIdAndDelete(reviewId);

      // Update product rating
      await ProductService.updateProductRating(productId);

      return { success: true, message: 'Review deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete review: ${error.message}`);
    }
  }

  // Mark review as helpful
  async markHelpful(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if already marked
      if (review.helpful.users.includes(userId)) {
        throw new Error('You have already marked this as helpful');
      }

      // Remove from unhelpful if exists
      review.unhelpful.users = review.unhelpful.users.filter(
        (id) => id.toString() !== userId.toString()
      );
      if (review.unhelpful.users.length < review.unhelpful.count) {
        review.unhelpful.count -= 1;
      }

      review.helpful.users.push(userId);
      review.helpful.count += 1;

      await review.save();
      return { success: true, review };
    } catch (error) {
      throw new Error(`Failed to mark review as helpful: ${error.message}`);
    }
  }

  // Mark review as unhelpful
  async markUnhelpful(reviewId, userId) {
    try {
      const review = await Review.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      // Check if already marked
      if (review.unhelpful.users.includes(userId)) {
        throw new Error('You have already marked this as unhelpful');
      }

      // Remove from helpful if exists
      review.helpful.users = review.helpful.users.filter(
        (id) => id.toString() !== userId.toString()
      );
      if (review.helpful.users.length < review.helpful.count) {
        review.helpful.count -= 1;
      }

      review.unhelpful.users.push(userId);
      review.unhelpful.count += 1;

      await review.save();
      return { success: true, review };
    } catch (error) {
      throw new Error(`Failed to mark review as unhelpful: ${error.message}`);
    }
  }

  // Add seller response to review
  async addSellerResponse(reviewId, sellerId, comment) {
    try {
      const review = await Review.findById(reviewId).populate('productId');
      if (!review) {
        throw new Error('Review not found');
      }

      // Verify seller owns the product
      if (review.productId.sellerId.toString() !== sellerId.toString()) {
        throw new Error('Unauthorized: Only seller can respond');
      }

      review.sellerResponse = {
        comment,
        respondedAt: new Date(),
      };

      await review.save();
      return { success: true, review };
    } catch (error) {
      throw new Error(`Failed to add seller response: ${error.message}`);
    }
  }

  // Get review statistics for a product
  async getReviewStats(productId) {
    try {
      const reviews = await Review.find({
        productId,
        status: 'approved',
      });

      const stats = {
        totalReviews: reviews.length,
        averageRating: 0,
        distribution: {
          5: 0,
          4: 0,
          3: 0,
          2: 0,
          1: 0,
        },
        withImages: 0,
        withVideos: 0,
        verifiedPurchases: 0,
      };

      if (reviews.length === 0) {
        return stats;
      }

      let totalRating = 0;
      reviews.forEach((review) => {
        totalRating += review.rating;
        stats.distribution[review.rating]++;
        if (review.images.length > 0) stats.withImages++;
        if (review.videos.length > 0) stats.withVideos++;
        if (review.isVerifiedPurchase) stats.verifiedPurchases++;
      });

      stats.averageRating = Math.round((totalRating / reviews.length) * 10) / 10;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get review stats: ${error.message}`);
    }
  }

  // Get recent reviews
  async getRecentReviews(limit = 10) {
    try {
      const reviews = await Review.find({ status: 'approved' })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('userId', 'username profilePicture')
        .populate('productId', 'title images')
        .lean();

      return reviews;
    } catch (error) {
      throw new Error(`Failed to fetch recent reviews: ${error.message}`);
    }
  }
}

module.exports = new ReviewService();
