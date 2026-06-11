const router  = require('express').Router();
const Product = require('../models/Product');
const auth    = require('../middleware/auth');

// GET /api/products  — list all (public-safe: no stockKeys)
router.get('/', auth, async (req, res) => {
  try {
    const { category, active, q } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (active !== undefined) filter.active = active === 'true';
    if (q) filter.name = { $regex: q, $options: 'i' };
    const products = await Product.find(filter).select('-stockKeys').sort('-createdAt');
    res.json(products);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/products/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Product.findById(req.params.id).select('-stockKeys');
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products
router.post('/', auth, async (req, res) => {
  try {
    const p = await Product.create(req.body);
    res.status(201).json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /api/products/:id
router.put('/:id', auth, async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/products/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products/:id/add-keys — bulk add stock keys
router.post('/:id/add-keys', auth, async (req, res) => {
  try {
    const { keys } = req.body; // array of strings
    if (!Array.isArray(keys)) return res.status(400).json({ error: 'keys must be an array' });
    const p = await Product.findByIdAndUpdate(
      req.params.id,
      { $push: { stockKeys: { $each: keys } }, $inc: { stock: keys.length } },
      { new: true }
    );
    res.json({ message: `${keys.length} keys added`, stock: p.stock });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
