const router   = require('express').Router();
const Homepage = require('../models/Homepage');
const auth     = require('../middleware/auth');

// GET /api/homepage  — public (used by storefront)
router.get('/', async (req, res) => {
  try {
    let hp = await Homepage.findOne();
    if (!hp) hp = await Homepage.create({});
    res.json(hp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /api/homepage  — admin save
router.put('/', auth, async (req, res) => {
  try {
    let hp = await Homepage.findOne();
    if (!hp) hp = new Homepage();
    Object.assign(hp, req.body);
    await hp.save();
    res.json(hp);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;
