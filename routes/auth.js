const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const Admin  = require('../models/Admin');
const auth   = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Username and password required' });

    const admin = await Admin.findOne({ username: username.toLowerCase(), active: true });
    if (!admin)
      return res.status(401).json({ error: 'Invalid credentials' });

    const match = await admin.comparePassword(password);
    if (!match)
      return res.status(401).json({ error: 'Invalid credentials' });

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({ token, admin: { username: admin.username, name: admin.name, role: admin.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/change-password  (protected)
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 8)
      return res.status(400).json({ error: 'New password must be at least 8 characters' });

    const admin = await Admin.findById(req.admin.id);
    const match = await admin.comparePassword(currentPassword);
    if (!match)
      return res.status(401).json({ error: 'Current password incorrect' });

    admin.password = newPassword;
    await admin.save();
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me  (protected)
router.get('/me', auth, async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('-password');
  res.json(admin);
});

module.exports = router;
