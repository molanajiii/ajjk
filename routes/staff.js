const router = require('express').Router();
const Admin  = require('../models/Admin');
const auth   = require('../middleware/auth');

// GET /api/staff
router.get('/', auth, async (req, res) => {
  try {
    const staff = await Admin.find().select('-password').sort('name');
    res.json(staff);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/staff
router.post('/', auth, async (req, res) => {
  try {
    // Only super_admin can add staff
    if (req.admin.role !== 'super_admin')
      return res.status(403).json({ error: 'Forbidden' });
    const member = await Admin.create(req.body);
    res.status(201).json({ id: member._id, username: member.username, role: member.role });
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /api/staff/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    if (req.admin.role !== 'super_admin')
      return res.status(403).json({ error: 'Forbidden' });
    if (req.params.id === req.admin.id)
      return res.status(400).json({ error: 'Cannot delete yourself' });
    await Admin.findByIdAndDelete(req.params.id);
    res.json({ message: 'Removed' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
