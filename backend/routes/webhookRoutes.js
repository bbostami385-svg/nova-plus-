import express from 'express';
import IPNHandler from '../services/payment/IPNHandler.js';
import SSLCommerzGateway from '../services/payment/SSLCommerzGateway.js';

const router = express.Router();
const sslCommerzGateway = new SSLCommerzGateway();

/**
 * SSLCommerz IPN Webhook
 * POST /api/webhooks/sslcommerz/ipn
 *
 * This endpoint receives instant payment notifications from SSLCommerz
 * when payment status changes
 */
router.post('/sslcommerz/ipn', async (req, res) => {
  try {
    console.log('🔔 SSLCommerz IPN webhook received');

    // Validate webhook signature
    const isValid = sslCommerzGateway.validateWebhookSignature(req.headers, req.body);

    if (!isValid) {
      console.warn('⚠️ Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse webhook data
    const ipnData = sslCommerzGateway.parseWebhookData(req.body);

    console.log('📦 IPN Data:', {
      transactionId: ipnData.transactionId,
      status: ipnData.status,
      amount: ipnData.amount,
    });

    // Handle IPN
    const result = await IPNHandler.handleSSLCommerzIPN(ipnData);

    // Return success response to SSLCommerz
    res.json({
      success: true,
      message: 'IPN processed successfully',
      ...result,
    });
  } catch (error) {
    console.error('❌ IPN processing error:', error);

    // Still return 200 to acknowledge receipt
    // SSLCommerz will retry if we return error
    res.status(200).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * SSLCommerz Success Callback
 * GET /api/webhooks/sslcommerz/success
 *
 * User is redirected here after successful payment
 */
router.get('/sslcommerz/success', async (req, res) => {
  try {
    const { tran_id, val_id, status } = req.query;

    console.log('✅ SSLCommerz success callback received:', { tran_id, status });

    // Verify payment
    const result = await IPNHandler.handleSSLCommerzIPN({
      tran_id,
      val_id,
      status: 'VALID',
    });

    // Redirect to frontend success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/payment/success?transactionId=${tran_id}&status=${status}`
    );
  } catch (error) {
    console.error('Success callback error:', error);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/error?error=${error.message}`);
  }
});

/**
 * SSLCommerz Fail Callback
 * GET /api/webhooks/sslcommerz/fail
 *
 * User is redirected here after failed payment
 */
router.get('/sslcommerz/fail', async (req, res) => {
  try {
    const { tran_id, status, error_reason } = req.query;

    console.log('❌ SSLCommerz fail callback received:', { tran_id, status });

    // Record failed payment
    const result = await IPNHandler.handleSSLCommerzIPN({
      tran_id,
      status: 'FAILED',
      error_reason,
    });

    // Redirect to frontend error page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(
      `${frontendUrl}/payment/failed?transactionId=${tran_id}&reason=${error_reason}`
    );
  } catch (error) {
    console.error('Fail callback error:', error);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/error?error=${error.message}`);
  }
});

/**
 * SSLCommerz Cancel Callback
 * GET /api/webhooks/sslcommerz/cancel
 *
 * User is redirected here if they cancel payment
 */
router.get('/sslcommerz/cancel', async (req, res) => {
  try {
    const { tran_id, status } = req.query;

    console.log('⏸️ SSLCommerz cancel callback received:', { tran_id });

    // Record cancelled payment
    const result = await IPNHandler.handleSSLCommerzIPN({
      tran_id,
      status: 'CANCELLED',
    });

    // Redirect to frontend cancel page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/cancelled?transactionId=${tran_id}`);
  } catch (error) {
    console.error('Cancel callback error:', error);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payment/error?error=${error.message}`);
  }
});

export default router;
