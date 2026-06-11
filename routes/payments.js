const router = require('express').Router();
const crypto = require('crypto');
const Order  = require('../models/Order');

// ─── JAZZCASH CALLBACK ────────────────────────────────────
// POST /api/payments/jazzcash/callback
router.post('/jazzcash/callback', async (req, res) => {
  try {
    const { pp_TxnRefNo, pp_ResponseCode, pp_Amount, pp_MerchantID } = req.body;

    // Verify merchant
    if (pp_MerchantID !== process.env.JAZZCASH_MERCHANT_ID) {
      return res.status(400).send('Invalid merchant');
    }

    // pp_ResponseCode '000' = success
    const success = pp_ResponseCode === '000';
    const orderId = pp_TxnRefNo; // you should embed your orderId in TxnRefNo

    if (success && orderId) {
      await Order.findOneAndUpdate(
        { txnId: orderId },
        { status: 'Delivered' }
      );
    }
    res.send('OK');
  } catch (err) {
    console.error('JazzCash callback error:', err);
    res.status(500).send('Error');
  }
});

// ─── EASYPAISA CALLBACK ───────────────────────────────────
// POST /api/payments/easypaisa/callback
router.post('/easypaisa/callback', async (req, res) => {
  try {
    const { orderRefNum, transactionStatus } = req.body;
    if (transactionStatus === 'PAID' && orderRefNum) {
      await Order.findOneAndUpdate(
        { txnId: orderRefNum },
        { status: 'Delivered' }
      );
    }
    res.send('OK');
  } catch (err) {
    console.error('Easypaisa callback error:', err);
    res.status(500).send('Error');
  }
});

// ─── STRIPE WEBHOOK ───────────────────────────────────────
// POST /api/payments/stripe/webhook  (raw body required)
router.post('/stripe/webhook', require('express').raw({ type: 'application/json' }), async (req, res) => {
  try {
    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    const sig    = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const pi = event.data.object;
      await Order.findOneAndUpdate(
        { txnId: pi.id },
        { status: 'Delivered' }
      );
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Stripe webhook error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── MANUAL PAYMENT CONFIRM ──────────────────────────────
// PATCH /api/payments/confirm/:orderId  (admin only)
const auth = require('../middleware/auth');
router.patch('/confirm/:orderId', auth, async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId },
      { status: 'Delivered', txnId: req.body.txnId },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
