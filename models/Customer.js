const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name:       { type: String, required: true },
  email:      { type: String, required: true, unique: true, lowercase: true },
  phone:      { type: String },
  status:     { type: String, enum: ['Active','Banned'], default: 'Active' },
  totalOrders:{ type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrder:  { type: Date },
  notes:      { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
