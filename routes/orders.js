const router  = require('express').Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Customer= require('../models/Customer');
const auth    = require('../middleware/auth');

// GET /api/orders
router.get('/', auth, async (req, res) => {
  try {
    const { status, gateway, q, page = 1, limit = 50 } = req.query;
    const filter = {};
    if (status)  filter.status = status;
    if (gateway) filter.gateway = gateway;
    if (q) filter.$or = [
      { orderId: { $regex: q, $options: 'i' } },
      { 'customer.name': { $regex: q, $options: 'i' } },
      { 'customer.email': { $regex: q, $options: 'i' } },
    ];
    const orders = await Order.find(filter)
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('product', 'name category');
    const total = await Order.countDocuments(filter);
    res.json({ orders, total, page: Number(page) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/orders/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate('product');
    if (!order) return res.status(404).json({ error: 'Not found' });
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/orders  — create new order
router.post('/', auth, async (req, res) => {
  try {
    const order = await Order.create(req.body);
    // Update product stock & sold count
    if (order.product) {
      const product = await Product.findById(order.product);
      if (product) {
        let deliveryKey = null;
        if (product.delivery === 'Instant' && product.stockKeys.length > 0) {
          deliveryKey = product.stockKeys.shift();
          product.stock = Math.max(0, product.stock - 1);
        } else if (product.delivery === 'Instant') {
          product.stock = Math.max(0, product.stock - 1);
        }
        product.totalSold += 1;
        await product.save();
        if (deliveryKey) {
          order.deliveryKey = deliveryKey;
          order.status = 'Delivered';
          await order.save();
        }
      }
    }
    // Upsert customer stats
    await Customer.findOneAndUpdate(
      { email: order.customer.email },
      {
        name: order.customer.name,
        $inc: { totalOrders: 1, totalSpent: order.amount },
        $set: { lastOrder: new Date() }
      },
      { upsert: true }
    );
    res.status(201).json(order);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PATCH /api/orders/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status, deliveryKey } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, ...(deliveryKey && { deliveryKey }) },
      { new: true }
    );
    res.json(order);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/orders/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
