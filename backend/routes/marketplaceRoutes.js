import express from 'express';
import { auth } from '../middleware/auth.js';
import ProductService from '../services/ProductService.js';
import ReviewService from '../services/ReviewService.js';
import OrderService from '../services/OrderService.js';
import PaymentService from '../services/PaymentService.js';

const router = express.Router();

// ============ PRODUCT ROUTES ============

// Create product
router.post('/products/create', auth, async (req, res) => {
  try {
    const result = await ProductService.createProduct(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all products (marketplace)
router.get('/products', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      category: req.query.category,
      minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : null,
      maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : null,
      sortBy: req.query.sortBy,
    };

    const result = await ProductService.searchProducts(req.query.search, filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get product by ID
router.get('/products/:productId', async (req, res) => {
  try {
    const product = await ProductService.getProductById(req.params.productId);
    // Increment view count
    await ProductService.incrementViewCount(req.params.productId);
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update product
router.put('/products/:productId', auth, async (req, res) => {
  try {
    const result = await ProductService.updateProduct(
      req.params.productId,
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete product
router.delete('/products/:productId', auth, async (req, res) => {
  try {
    const result = await ProductService.deleteProduct(
      req.params.productId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get seller's products
router.get('/sellers/:sellerId/products', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
      category: req.query.category,
    };

    const result = await ProductService.getSellerProducts(req.params.sellerId, filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get trending products
router.get('/products/trending/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const products = await ProductService.getTrendingProducts(limit);
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get products by category
router.get('/categories/:category/products', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
    };

    const result = await ProductService.getProductsByCategory(
      req.params.category,
      filters
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Publish product
router.post('/products/:productId/publish', auth, async (req, res) => {
  try {
    const result = await ProductService.publishProduct(
      req.params.productId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get featured products
router.get('/products/featured/all', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const products = await ProductService.getFeaturedProducts(limit);
    res.json(products);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ REVIEW ROUTES ============

// Create review
router.post('/reviews/create', auth, async (req, res) => {
  try {
    const result = await ReviewService.createReview(
      req.user.id,
      req.body.productId,
      req.body.orderId,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get product reviews
router.get('/products/:productId/reviews', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy,
    };

    const result = await ReviewService.getProductReviews(
      req.params.productId,
      filters
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user reviews
router.get('/users/:userId/reviews', async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
    };

    const result = await ReviewService.getUserReviews(req.params.userId, filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update review
router.put('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const result = await ReviewService.updateReview(
      req.params.reviewId,
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete review
router.delete('/reviews/:reviewId', auth, async (req, res) => {
  try {
    const result = await ReviewService.deleteReview(
      req.params.reviewId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark review as helpful
router.post('/reviews/:reviewId/helpful', auth, async (req, res) => {
  try {
    const result = await ReviewService.markHelpful(
      req.params.reviewId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Mark review as unhelpful
router.post('/reviews/:reviewId/unhelpful', auth, async (req, res) => {
  try {
    const result = await ReviewService.markUnhelpful(
      req.params.reviewId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add seller response
router.post('/reviews/:reviewId/response', auth, async (req, res) => {
  try {
    const result = await ReviewService.addSellerResponse(
      req.params.reviewId,
      req.user.id,
      req.body.comment
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get review stats
router.get('/products/:productId/reviews/stats/all', async (req, res) => {
  try {
    const stats = await ReviewService.getReviewStats(req.params.productId);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ ORDER ROUTES ============

// Create order
router.post('/orders/create', auth, async (req, res) => {
  try {
    const result = await OrderService.createOrder(req.user.id, req.body);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get order by ID
router.get('/orders/:orderId', auth, async (req, res) => {
  try {
    const order = await OrderService.getOrderById(req.params.orderId, req.user.id);
    res.json(order);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get buyer's orders
router.get('/orders/buyer/all', auth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
    };

    const result = await OrderService.getBuyerOrders(req.user.id, filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get seller's orders
router.get('/orders/seller/all', auth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
    };

    const result = await OrderService.getSellerOrders(req.user.id, filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update order status
router.put('/orders/:orderId/status', auth, async (req, res) => {
  try {
    const result = await OrderService.updateOrderStatus(
      req.params.orderId,
      req.user.id,
      req.body.status
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add tracking info
router.post('/orders/:orderId/tracking', auth, async (req, res) => {
  try {
    const result = await OrderService.addTrackingInfo(
      req.params.orderId,
      req.user.id,
      req.body
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Cancel order
router.post('/orders/:orderId/cancel', auth, async (req, res) => {
  try {
    const result = await OrderService.cancelOrder(
      req.params.orderId,
      req.user.id,
      req.body.reason
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get order stats
router.get('/orders/stats/seller', auth, async (req, res) => {
  try {
    const stats = await OrderService.getOrderStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============ PAYMENT ROUTES ============

// Create payment intent
router.post('/payments/create-intent', auth, async (req, res) => {
  try {
    const result = await PaymentService.createPaymentIntent(
      req.user.id,
      req.body.orderId,
      req.body.amount,
      req.body.currency
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Confirm payment
router.post('/payments/confirm', auth, async (req, res) => {
  try {
    const result = await PaymentService.confirmPayment(
      req.body.paymentIntentId,
      req.user.id
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Process refund
router.post('/payments/:paymentId/refund', auth, async (req, res) => {
  try {
    const result = await PaymentService.processRefund(
      req.params.paymentId,
      req.user.id,
      req.body.reason
    );
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get user payments
router.get('/payments', auth, async (req, res) => {
  try {
    const filters = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      status: req.query.status,
    };

    const result = await PaymentService.getUserPayments(req.user.id, filters);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get payment stats
router.get('/payments/stats/all', auth, async (req, res) => {
  try {
    const stats = await PaymentService.getPaymentStats(req.user.id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Webhook for Stripe events
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const event = JSON.parse(req.body);
    await PaymentService.handleWebhookEvent(event);
    res.json({ received: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
