const router  = require('express').Router();
const Order   = require('../models/Order');
const Product = require('../models/Product');
const Customer= require('../models/Customer');
const auth    = require('../middleware/auth');

// GET /api/analytics/dashboard  — summary for dashboard
router.get('/dashboard', auth, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0,0,0,0);

    const [
      revenueToday,
      ordersToday,
      pendingOrders,
      lowStockCount,
      totalCustomers,
      openTickets,
    ] = await Promise.all([
      Order.aggregate([
        { $match: { createdAt: { $gte: today }, status: 'Delivered' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Order.countDocuments({ createdAt: { $gte: today } }),
      Order.countDocuments({ status: 'Pending' }),
      Product.countDocuments({ stock: { $lte: 10 }, active: true }),
      Customer.countDocuments(),
      // Ticket is optional — swallow error if collection empty
      require('../models/Ticket').countDocuments({ status: { $in: ['Open','In Progress'] } }).catch(() => 0),
    ]);

    res.json({
      revenueToday:  revenueToday[0]?.total || 0,
      ordersToday,
      pendingOrders,
      lowStockCount,
      totalCustomers,
      openTickets,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/revenue?days=30  — revenue over N days
router.get('/revenue', auth, async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const from = new Date();
    from.setDate(from.getDate() - days);

    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: from }, status: 'Delivered' } },
      { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$amount' },
          orders:  { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/gateway  — gateway breakdown
router.get('/gateway', auth, async (req, res) => {
  try {
    const data = await Order.aggregate([
      { $match: { status: 'Delivered' } },
      { $group: { _id: '$gateway', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } }
    ]);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/analytics/top-products
router.get('/top-products', auth, async (req, res) => {
  try {
    const data = await Product.find().select('name category totalSold').sort('-totalSold').limit(10);
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
