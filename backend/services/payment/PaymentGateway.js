/**
 * Abstract Payment Gateway Interface
 * This defines the contract that all payment gateway implementations must follow
 * Allows easy switching between SSLCommerz, Stripe, and other payment providers
 */

export class PaymentGateway {
  /**
   * Initialize payment gateway with configuration
   * @param {Object} config - Gateway configuration
   */
  async initialize(config) {
    throw new Error('initialize() must be implemented');
  }

  /**
   * Create a payment session/intent
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} Payment session details
   */
  async createPayment(paymentData) {
    throw new Error('createPayment() must be implemented');
  }

  /**
   * Verify payment with gateway
   * @param {string} transactionId - Transaction ID from gateway
   * @param {Object} verificationData - Data for verification
   * @returns {Promise<Object>} Verification result
   */
  async verifyPayment(transactionId, verificationData) {
    throw new Error('verifyPayment() must be implemented');
  }

  /**
   * Get payment status
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Payment status
   */
  async getPaymentStatus(transactionId) {
    throw new Error('getPaymentStatus() must be implemented');
  }

  /**
   * Refund a payment
   * @param {string} transactionId - Original transaction ID
   * @param {number} amount - Refund amount
   * @param {string} reason - Refund reason
   * @returns {Promise<Object>} Refund result
   */
  async refundPayment(transactionId, amount, reason) {
    throw new Error('refundPayment() must be implemented');
  }

  /**
   * Get refund status
   * @param {string} refundId - Refund ID
   * @returns {Promise<Object>} Refund status
   */
  async getRefundStatus(refundId) {
    throw new Error('getRefundStatus() must be implemented');
  }

  /**
   * Validate webhook signature
   * @param {Object} headers - Request headers
   * @param {string} body - Request body
   * @returns {boolean} Is valid
   */
  validateWebhookSignature(headers, body) {
    throw new Error('validateWebhookSignature() must be implemented');
  }

  /**
   * Parse webhook data
   * @param {Object} data - Webhook data
   * @returns {Object} Parsed data
   */
  parseWebhookData(data) {
    throw new Error('parseWebhookData() must be implemented');
  }

  /**
   * Get supported payment methods
   * @returns {Array<string>} Payment methods
   */
  getSupportedMethods() {
    throw new Error('getSupportedMethods() must be implemented');
  }

  /**
   * Check if gateway is available
   * @returns {Promise<boolean>} Is available
   */
  async isAvailable() {
    throw new Error('isAvailable() must be implemented');
  }

  /**
   * Get gateway health status
   * @returns {Promise<Object>} Health status
   */
  async getHealthStatus() {
    throw new Error('getHealthStatus() must be implemented');
  }
}

export default PaymentGateway;
