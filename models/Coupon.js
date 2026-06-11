const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true, uppercase: true, trim: true },
  type:       { type: String, enum: ['percent','fixed'], required: true },
  value:      { type: Number, required: true },
  usageLimit: { type: Number, default: null },   // null = unlimited
  usedCount:  { type: Number, default: 0 },
  expiresAt:  { type: Date, default: null },
  active:     { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Coupon', couponSchema);
