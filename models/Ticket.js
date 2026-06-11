const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  ticketId:  { type: String, unique: true },
  customer:  { type: String, required: true },
  email:     { type: String },
  issue:     { type: String, required: true },
  priority:  { type: String, enum: ['High','Medium','Low'], default: 'Medium' },
  status:    { type: String, enum: ['Open','In Progress','Resolved'], default: 'Open' },
  replies:   [{ by: String, message: String, at: { type: Date, default: Date.now } }],
  orderId:   { type: String },
}, { timestamps: true });

ticketSchema.pre('save', async function (next) {
  if (!this.ticketId) {
    const count = await mongoose.model('Ticket').countDocuments();
    this.ticketId = `#T-${String(80 + count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema);
