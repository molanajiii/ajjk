const router = require('express').Router();
const Coupon = require('../models/Coupon');
const auth   = require('../middleware/auth');

// GET /api/coupons
router.get('/', auth, async (req, res) => {
  try {
    res.json(await Coupon.find().sort('-createdAt'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/coupons/validate  — public endpoint for storefront
router.post('/validate', async (req, res) => {
  try {
    const { code, amount } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ error: 'Invalid or inactive coupon' });
    if (coupon.expiresAt && coupon.expiresAt < new Date())
      return res.status(400).json({ error: 'Coupon expired' });
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ error: 'Coupon usage limit reached' });

    const discount = coupon.type === 'percent'
      ? (amount * coupon.value) / 100
      : coupon.value;
    res.json({ valid: true, discount, type: coupon.type, value: coupon.value });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/coupons
router.post('/', auth, async (req, res) => {
  try {
    const coupon = await Coupon.create(req.body);
    res.status(201).json(coupon);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/coupons/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const c = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(c);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/coupons/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
