import axios from 'axios';
import crypto from 'crypto';
import PaymentGateway from './PaymentGateway.js';

export class SSLCommerzGateway extends PaymentGateway {
  constructor() {
    super();
    this.storeId = process.env.SSLCOMMERZ_STORE_ID;
    this.storePassword = process.env.SSLCOMMERZ_STORE_PASSWORD;
    this.isProduction = process.env.NODE_ENV === 'production';
    this.baseUrl = this.isProduction
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';
  }

  async initialize(config) {
    if (!this.storeId || !this.storePassword) {
      throw new Error('SSLCommerz credentials not configured');
    }

    // Test connection
    try {
      await this.getHealthStatus();
      console.log('✅ SSLCommerz gateway initialized successfully');
    } catch (error) {
      console.error('❌ SSLCommerz initialization failed:', error.message);
      throw error;
    }
  }

  /**
   * Create payment session for SSLCommerz hosted payment page
   */
  async createPayment(paymentData) {
    try {
      const {
        transactionId,
        amount,
        currency = 'BDT',
        customerEmail,
        customerPhone,
        customerName,
        purpose,
        successUrl,
        failUrl,
        cancelUrl,
        metadata = {},
      } = paymentData;

      // Validate required fields
      if (!transactionId || !amount || !customerEmail || !customerPhone) {
        throw new Error('Missing required payment data');
      }

      // Prepare payment data for SSLCommerz
      const postData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        total_amount: amount,
        currency: currency,
        tran_id: transactionId,
        success_url: successUrl,
        fail_url: failUrl,
        cancel_url: cancelUrl,
        cus_name: customerName,
        cus_email: customerEmail,
        cus_phone: customerPhone,
        cus_add1: metadata.address || 'N/A',
        cus_city: metadata.city || 'Dhaka',
        cus_state: metadata.state || 'Dhaka',
        cus_postcode: metadata.postalCode || '1000',
        cus_country: metadata.country || 'Bangladesh',
        shipping_method: 'NO',
        product_name: purpose,
        product_category: metadata.category || 'Digital',
        product_profile: 'digital',
      };

      // Make request to SSLCommerz
      const response = await axios.post(`${this.baseUrl}/gwprocess/v4/api.php`, postData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (response.data.status !== 'SUCCESS') {
        throw new Error(`SSLCommerz API error: ${response.data.failedreason}`);
      }

      return {
        success: true,
        gateway: 'sslcommerz',
        transactionId,
        sessionKey: response.data.sessionkey,
        redirectUrl: `${this.baseUrl}/customer/pay/${response.data.sessionkey}`,
        gatewayTransactionId: response.data.sessionkey,
      };
    } catch (error) {
      console.error('SSLCommerz createPayment error:', error.message);
      throw new Error(`Failed to create payment: ${error.message}`);
    }
  }

  /**
   * Verify payment using validation API
   */
  async verifyPayment(transactionId, verificationData) {
    try {
      const { validationId } = verificationData;

      if (!validationId) {
        throw new Error('Validation ID is required');
      }

      // Prepare validation request
      const postData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        val_id: validationId,
      };

      // Call SSLCommerz validation API
      const response = await axios.post(
        `${this.baseUrl}/validator/api/validationserverAPI.php`,
        postData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.status !== 'VALID') {
        return {
          success: false,
          verified: false,
          reason: response.data.status,
        };
      }

      return {
        success: true,
        verified: true,
        transactionId: response.data.tran_id,
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        status: response.data.status,
        bankTranId: response.data.bank_tran_id,
        cardBrand: response.data.card_brand,
        cardNumber: response.data.card_number,
        riskLevel: response.data.risk_level,
        riskTitle: response.data.risk_title,
        paymentMethod: response.data.payment_type,
        gatewayTransactionId: validationId,
      };
    } catch (error) {
      console.error('SSLCommerz verifyPayment error:', error.message);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(transactionId) {
    try {
      const postData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        tran_id: transactionId,
      };

      const response = await axios.post(
        `${this.baseUrl}/validator/api/merchantTransactionQueryRequest.php`,
        postData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.data.element || response.data.element.length === 0) {
        return {
          success: false,
          status: 'not_found',
        };
      }

      const transaction = response.data.element[0];

      return {
        success: true,
        transactionId: transaction.tran_id,
        status: transaction.status,
        amount: parseFloat(transaction.amount),
        currency: transaction.currency,
        paymentMethod: transaction.payment_type,
        bankTranId: transaction.bank_tran_id,
      };
    } catch (error) {
      console.error('SSLCommerz getPaymentStatus error:', error.message);
      throw new Error(`Failed to get payment status: ${error.message}`);
    }
  }

  /**
   * Refund payment
   */
  async refundPayment(transactionId, amount, reason) {
    try {
      const postData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        refund_amount: amount,
        refund_remarks: reason,
        bank_tran_id: transactionId,
      };

      const response = await axios.post(
        `${this.baseUrl}/validator/api/merchantInitiaterefund.php`,
        postData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(`Refund failed: ${response.data.failedreason}`);
      }

      return {
        success: true,
        refundId: response.data.refund_ref_id,
        status: response.data.status,
        amount: amount,
        transactionId,
      };
    } catch (error) {
      console.error('SSLCommerz refundPayment error:', error.message);
      throw new Error(`Refund failed: ${error.message}`);
    }
  }

  /**
   * Get refund status
   */
  async getRefundStatus(refundId) {
    try {
      const postData = {
        store_id: this.storeId,
        store_passwd: this.storePassword,
        refund_ref_id: refundId,
      };

      const response = await axios.post(
        `${this.baseUrl}/validator/api/merchantQueryRefund.php`,
        postData,
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      if (!response.data.element || response.data.element.length === 0) {
        return {
          success: false,
          status: 'not_found',
        };
      }

      const refund = response.data.element[0];

      return {
        success: true,
        refundId: refund.refund_ref_id,
        status: refund.refund_status,
        amount: parseFloat(refund.refund_amount),
        originalAmount: parseFloat(refund.amount),
      };
    } catch (error) {
      console.error('SSLCommerz getRefundStatus error:', error.message);
      throw new Error(`Failed to get refund status: ${error.message}`);
    }
  }

  /**
   * Validate IPN signature
   */
  validateWebhookSignature(headers, body) {
    try {
      // SSLCommerz uses MD5 hash for IPN validation
      const hash = headers['x-sslcommerz-signature'] || headers['X-SSLCommerz-Signature'];

      if (!hash) {
        return false;
      }

      // Create signature from body
      const bodyString = typeof body === 'string' ? body : JSON.stringify(body);
      const calculatedHash = crypto
        .createHash('md5')
        .update(bodyString + this.storePassword)
        .digest('hex');

      return hash === calculatedHash;
    } catch (error) {
      console.error('Signature validation error:', error.message);
      return false;
    }
  }

  /**
   * Parse IPN webhook data
   */
  parseWebhookData(data) {
    return {
      transactionId: data.tran_id,
      validationId: data.val_id,
      amount: parseFloat(data.amount),
      currency: data.currency,
      status: data.status,
      paymentMethod: data.payment_type,
      bankTransactionId: data.bank_tran_id,
      cardBrand: data.card_brand,
      cardNumber: data.card_number,
      riskLevel: data.risk_level,
      riskTitle: data.risk_title,
      customerEmail: data.cus_email,
      customerPhone: data.cus_phone,
      customerName: data.cus_name,
    };
  }

  /**
   * Get supported payment methods
   */
  getSupportedMethods() {
    return ['bkash', 'nagad', 'rocket', 'card'];
  }

  /**
   * Check if gateway is available
   */
  async isAvailable() {
    try {
      const response = await axios.get(`${this.baseUrl}/`, {
        timeout: 5000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get gateway health status
   */
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      const response = await axios.get(`${this.baseUrl}/`, {
        timeout: 5000,
      });
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        gateway: 'sslcommerz',
        responseTime,
        environment: this.isProduction ? 'production' : 'sandbox',
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        gateway: 'sslcommerz',
        error: error.message,
      };
    }
  }
}

export default SSLCommerzGateway;
