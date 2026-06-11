const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  category:     {
    type: String,
    enum: ['Games','Gift Cards','Software','AI Tools','Game Items','Accounts','Subscriptions','Top Up'],
    required: true
  },
  price:        { type: Number, required: true, min: 0 },
  salePrice:    { type: Number, default: null },
  stock:        { type: Number, default: 0, min: 0 },
  stockLabel:   { type: String, default: 'units' }, // 'keys', 'codes', 'licenses'
  stockKeys:    [{ type: String }],                 // actual delivery keys/codes
  delivery:     { type: String, enum: ['Instant','Manual'], default: 'Instant' },
  active:       { type: Boolean, default: true },
  totalSold:    { type: Number, default: 0 },
  description:  { type: String },
  imageUrl:     { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
