const router   = require('express').Router();
const Customer = require('../models/Customer');
const auth     = require('../middleware/auth');

// GET /api/customers
router.get('/', auth, async (req, res) => {
  try {
    const { q, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) filter.$or = [
      { name:  { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
    const customers = await Customer.find(filter).sort('-totalSpent');
    res.json(customers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/customers/:id/ban
router.patch('/:id/ban', auth, async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, { status: 'Banned' }, { new: true });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/customers/:id/unban
router.patch('/:id/unban', auth, async (req, res) => {
  try {
    const c = await Customer.findByIdAndUpdate(req.params.id, { status: 'Active' }, { new: true });
    res.json(c);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/customers/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
