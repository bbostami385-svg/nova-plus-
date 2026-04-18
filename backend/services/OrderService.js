const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const ProductService = require('./ProductService');
const crypto = require('crypto');

class OrderService {
  // Generate unique order ID
  generateOrderId() {
    return `ORD-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  }

  // Create order
  async createOrder(buyerId, orderData) {
    try {
      const orderId = this.generateOrderId();

      // Validate products and calculate totals
      let subtotal = 0;
      const items = [];

      for (const item of orderData.items) {
        const product = await Product.findById(item.productId);
        if (!product) {
          throw new Error(`Product ${item.productId} not found`);
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.title}`);
        }

        const itemTotal = product.discountedPrice * item.quantity;
        subtotal += itemTotal;

        items.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
          discount: product.discount,
          total: itemTotal,
          variant: item.variant || {},
        });
      }

      // Calculate totals
      const shippingCost = orderData.shippingCost || 0;
      const tax = Math.round((subtotal * 0.1) * 100) / 100; // 10% tax
      const discount = orderData.discount || 0;
      const total = subtotal + shippingCost + tax - discount;

      const order = new Order({
        orderId,
        buyerId,
        sellerId: items[0].productId ? (await Product.findById(items[0].productId)).sellerId : null,
        items,
        subtotal,
        shippingCost,
        tax,
        discount,
        total,
        shippingAddress: orderData.shippingAddress,
        billingAddress: orderData.billingAddress || orderData.shippingAddress,
        payment: {
          method: orderData.paymentMethod,
          status: 'pending',
        },
        notes: orderData.notes,
      });

      await order.save();
      return { success: true, order };
    } catch (error) {
      throw new Error(`Failed to create order: ${error.message}`);
    }
  }

  // Get order by ID
  async getOrderById(orderId, userId) {
    try {
      const order = await Order.findById(orderId)
        .populate('buyerId', 'username email profilePicture')
        .populate('sellerId', 'username email profilePicture')
        .populate('items.productId', 'title images price')
        .lean();

      if (!order) {
        throw new Error('Order not found');
      }

      // Check authorization
      if (order.buyerId._id.toString() !== userId.toString() && 
          order.sellerId._id.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Cannot access this order');
      }

      return order;
    } catch (error) {
      throw new Error(`Failed to fetch order: ${error.message}`);
    }
  }

  // Get buyer's orders
  async getBuyerOrders(buyerId, filters = {}) {
    try {
      const query = { buyerId };

      if (filters.status) {
        query.status = filters.status;
      }

      const skip = (filters.page - 1) * (filters.limit || 20);
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit || 20)
        .populate('sellerId', 'username profilePicture')
        .populate('items.productId', 'title images')
        .lean();

      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch buyer orders: ${error.message}`);
    }
  }

  // Get seller's orders
  async getSellerOrders(sellerId, filters = {}) {
    try {
      const query = { sellerId };

      if (filters.status) {
        query.status = filters.status;
      }

      const skip = (filters.page - 1) * (filters.limit || 20);
      const orders = await Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(filters.limit || 20)
        .populate('buyerId', 'username email profilePicture')
        .populate('items.productId', 'title')
        .lean();

      const total = await Order.countDocuments(query);

      return {
        orders,
        pagination: {
          total,
          page: filters.page || 1,
          limit: filters.limit || 20,
          pages: Math.ceil(total / (filters.limit || 20)),
        },
      };
    } catch (error) {
      throw new Error(`Failed to fetch seller orders: ${error.message}`);
    }
  }

  // Update order status
  async updateOrderStatus(orderId, sellerId, newStatus) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.sellerId.toString() !== sellerId.toString()) {
        throw new Error('Unauthorized: Only seller can update order status');
      }

      order.status = newStatus;

      if (newStatus === 'shipped') {
        order.shipping.shippedAt = new Date();
      } else if (newStatus === 'delivered') {
        order.shipping.actualDelivery = new Date();
      } else if (newStatus === 'cancelled') {
        order.cancelledAt = new Date();
      }

      await order.save();
      return { success: true, order };
    } catch (error) {
      throw new Error(`Failed to update order status: ${error.message}`);
    }
  }

  // Add tracking information
  async addTrackingInfo(orderId, sellerId, trackingData) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.sellerId.toString() !== sellerId.toString()) {
        throw new Error('Unauthorized: Only seller can add tracking info');
      }

      order.shipping = {
        ...order.shipping,
        ...trackingData,
      };

      await order.save();
      return { success: true, order };
    } catch (error) {
      throw new Error(`Failed to add tracking info: ${error.message}`);
    }
  }

  // Process refund
  async processRefund(orderId, buyerId, refundData) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      if (order.buyerId.toString() !== buyerId.toString()) {
        throw new Error('Unauthorized: Only buyer can request refund');
      }

      if (order.payment.status !== 'completed') {
        throw new Error('Cannot refund unpaid order');
      }

      // Update payment status
      const payment = await Payment.findOne({ orderId });
      if (payment) {
        payment.status = 'refunded';
        payment.amountRefunded = order.total;
        await payment.save();
      }

      order.status = 'refunded';
      order.payment.status = 'refunded';
      order.payment.refundedAmount = order.total;

      await order.save();
      return { success: true, order };
    } catch (error) {
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  // Cancel order
  async cancelOrder(orderId, userId, reason) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Order not found');
      }

      // Check authorization
      if (order.buyerId.toString() !== userId.toString() && 
          order.sellerId.toString() !== userId.toString()) {
        throw new Error('Unauthorized: Cannot cancel this order');
      }

      if (['delivered', 'cancelled', 'refunded'].includes(order.status)) {
        throw new Error(`Cannot cancel order with status: ${order.status}`);
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = reason;

      // Restore stock
      for (const item of order.items) {
        await ProductService.recordSale(item.productId, -item.quantity, -item.total);
      }

      await order.save();
      return { success: true, order };
    } catch (error) {
      throw new Error(`Failed to cancel order: ${error.message}`);
    }
  }

  // Get order statistics
  async getOrderStats(sellerId) {
    try {
      const orders = await Order.find({ sellerId });

      const stats = {
        totalOrders: orders.length,
        totalRevenue: 0,
        averageOrderValue: 0,
        statusBreakdown: {
          pending: 0,
          confirmed: 0,
          processing: 0,
          shipped: 0,
          delivered: 0,
          cancelled: 0,
        },
        paymentStatus: {
          pending: 0,
          completed: 0,
          failed: 0,
          refunded: 0,
        },
      };

      orders.forEach((order) => {
        stats.totalRevenue += order.total;
        stats.statusBreakdown[order.status]++;
        stats.paymentStatus[order.payment.status]++;
      });

      stats.averageOrderValue = stats.totalOrders > 0 
        ? Math.round((stats.totalRevenue / stats.totalOrders) * 100) / 100 
        : 0;

      return stats;
    } catch (error) {
      throw new Error(`Failed to get order stats: ${error.message}`);
    }
  }

  // Get recent orders
  async getRecentOrders(limit = 10) {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate('buyerId', 'username profilePicture')
        .populate('sellerId', 'username profilePicture')
        .lean();

      return orders;
    } catch (error) {
      throw new Error(`Failed to fetch recent orders: ${error.message}`);
    }
  }
}

module.exports = new OrderService();
