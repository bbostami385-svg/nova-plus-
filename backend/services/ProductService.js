const Product = require('../models/Product');
const User = require('../models/User');

class ProductService {
  // Create a new product
  async createProduct(sellerId, productData) {
    try {
      const product = new Product({
        sellerId,
        ...productData,
        status: 'draft',
      });
      await product.save();
      return { success: true, product };
    } catch (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }
  }

  // Get product by ID
  async getProductById(productId) {
    try {
      const product = await Product.findById(productId)
        .populate('sellerId', 'username profilePicture rating')
        .lean();
      if (!product) {
        throw new Error('Product not found');
      }
      return product;
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  // Update product
  async updateProduct(productId, sellerId, updateData) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      if (product.sellerId.toString() !== sellerId.toString()) {
        throw new Error('Unauthorized: Only seller can update this product');
      }

      Object.assign(product, updateData);
      await product.save();
      return { success: true, product };
    } catch (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }
  }

  // Delete product
  async deleteProduct(productId, sellerId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      if (product.sellerId.toString() !== sellerId.toString()) {
        throw new Error('Unauthorized: Only seller can delete this product');
      }

      await Product.findByIdAndDelete(productId);
      return { success: true, message: 'Product deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }

  // Get seller's products
  async getSellerProducts(sellerId, filters = {}) {
    try {
      const query = { sellerId };

      if (filters.status) {
        query.status = filters.status;
      }
      if (filters.category) {
        query.category = filters.category;
      }

      const skip = (filters.page - 1) * (filters.limit || 20);
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit || 20)
        .lean();

      const total = await Product.countDocuments(query);

      return {
        products,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch seller products: ${error.message}`);
    }
  }

  // Search products
  async searchProducts(query, filters = {}) {
    try {
      const searchQuery = {
        status: 'active',
        visibility: 'public',
      };

      if (query) {
        searchQuery.$text = { $search: query };
      }

      if (filters.category) {
        searchQuery.category = filters.category;
      }

      if (filters.minPrice || filters.maxPrice) {
        searchQuery.price = {};
        if (filters.minPrice) {
          searchQuery.price.$gte = filters.minPrice;
        }
        if (filters.maxPrice) {
          searchQuery.price.$lte = filters.maxPrice;
        }
      }

      if (filters.minRating) {
        searchQuery['rating.average'] = { $gte: filters.minRating };
      }

      const skip = (filters.page - 1) * (filters.limit || 20);
      const sortOption = {};

      if (filters.sortBy === 'price_asc') {
        sortOption.price = 1;
      } else if (filters.sortBy === 'price_desc') {
        sortOption.price = -1;
      } else if (filters.sortBy === 'rating') {
        sortOption['rating.average'] = -1;
      } else if (filters.sortBy === 'newest') {
        sortOption.createdAt = -1;
      } else if (filters.sortBy === 'popular') {
        sortOption.sales = -1;
      }

      const products = await Product.find(searchQuery)
        .sort(sortOption)
        .skip(skip)
        .limit(filters.limit || 20)
        .populate('sellerId', 'username profilePicture rating')
        .lean();

      const total = await Product.countDocuments(searchQuery);

      return {
        products,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to search products: ${error.message}`);
    }
  }

  // Get trending products
  async getTrendingProducts(limit = 20) {
    try {
      const products = await Product.find({
        status: 'active',
        visibility: 'public',
      })
        .sort({ 'sales.count': -1, 'rating.average': -1 })
        .limit(limit)
        .populate('sellerId', 'username profilePicture rating')
        .lean();

      return products;
    } catch (error) {
      throw new Error(`Failed to fetch trending products: ${error.message}`);
    }
  }

  // Get products by category
  async getProductsByCategory(category, filters = {}) {
    try {
      const query = {
        category,
        status: 'active',
        visibility: 'public',
      };

      const skip = (filters.page - 1) * (filters.limit || 20);
      const products = await Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit || 20)
        .populate('sellerId', 'username profilePicture rating')
        .lean();

      const total = await Product.countDocuments(query);

      return {
        products,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch products by category: ${error.message}`);
    }
  }

  // Publish product
  async publishProduct(productId, sellerId) {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }
      if (product.sellerId.toString() !== sellerId.toString()) {
        throw new Error('Unauthorized: Only seller can publish this product');
      }

      product.status = 'active';
      product.publishedAt = new Date();
      await product.save();

      return { success: true, product };
    } catch (error) {
      throw new Error(`Failed to publish product: ${error.message}`);
    }
  }

  // Increment view count
  async incrementViewCount(productId) {
    try {
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { views: 1 } },
        { new: true }
      );
    } catch (error) {
      console.error('Failed to increment view count:', error);
    }
  }

  // Add to favorites
  async addToFavorites(productId) {
    try {
      await Product.findByIdAndUpdate(
        productId,
        { $inc: { favorites: 1 } },
        { new: true }
      );
    } catch (error) {
      console.error('Failed to add to favorites:', error);
    }
  }

  // Record sale
  async recordSale(productId, quantity, amount) {
    try {
      const product = await Product.findByIdAndUpdate(
        productId,
        {
          $inc: {
            'sales.count': quantity,
            'sales.revenue': amount,
            stock: -quantity,
          },
          'sales.lastSaleDate': new Date(),
        },
        { new: true }
      );

      return product;
    } catch (error) {
      throw new Error(`Failed to record sale: ${error.message}`);
    }
  }

  // Update product rating
  async updateProductRating(productId) {
    try {
      const Review = require('../models/Review');
      const reviews = await Review.find({
        productId,
        status: 'approved',
      });

      if (reviews.length === 0) {
        await Product.findByIdAndUpdate(productId, {
          'rating.average': 0,
          'rating.count': 0,
        });
        return;
      }

      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
      const averageRating = totalRating / reviews.length;

      const distribution = {
        5: reviews.filter((r) => r.rating === 5).length,
        4: reviews.filter((r) => r.rating === 4).length,
        3: reviews.filter((r) => r.rating === 3).length,
        2: reviews.filter((r) => r.rating === 2).length,
        1: reviews.filter((r) => r.rating === 1).length,
      };

      await Product.findByIdAndUpdate(productId, {
        'rating.average': Math.round(averageRating * 10) / 10,
        'rating.count': reviews.length,
        'rating.distribution': distribution,
      });
    } catch (error) {
      throw new Error(`Failed to update product rating: ${error.message}`);
    }
  }

  // Get featured products
  async getFeaturedProducts(limit = 10) {
    try {
      const products = await Product.find({
        isFeatured: true,
        status: 'active',
        visibility: 'public',
      })
        .limit(limit)
        .populate('sellerId', 'username profilePicture rating')
        .lean();

      return products;
    } catch (error) {
      throw new Error(`Failed to fetch featured products: ${error.message}`);
    }
  }
}

module.exports = new ProductService();
