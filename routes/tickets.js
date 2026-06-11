const router = require('express').Router();
const Ticket = require('../models/Ticket');
const auth   = require('../middleware/auth');

// GET /api/tickets
router.get('/', auth, async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    res.json(await Ticket.find(filter).sort('-createdAt'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/tickets  — customer creates ticket (public)
router.post('/', async (req, res) => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json(ticket);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// POST /api/tickets/:id/reply  — admin replies
router.post('/:id/reply', auth, async (req, res) => {
  try {
    const { message } = req.body;
    const ticket = await Ticket.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { by: req.admin.username, message } },
        status: 'In Progress'
      },
      { new: true }
    );
    res.json(ticket);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH /api/tickets/:id/status
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const t = await Ticket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE /api/tickets/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Ticket.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
