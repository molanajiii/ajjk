const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId:     { type: String, unique: true },          // e.g. #4821
  customer:    {
    name:  { type: String, required: true },
    email: { type: String, required: true },
  },
  product:     { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  productName: { type: String },
  amount:      { type: Number, required: true },
  gateway:     {
    type: String,
    enum: ['JazzCash','Easypaisa','Stripe','Alfalah IBFT','Meezan IBAN'],
    required: true
  },
  status: {
    type: String,
    enum: ['Pending','Delivered','Failed','Refunded'],
    default: 'Pending'
  },
  txnId:         { type: String },            // gateway transaction ID
  deliveryKey:   { type: String },            // key/code sent to customer
  couponApplied: { type: String },
  notes:         { type: String },
}, { timestamps: true });

// Auto-generate orderId before save
orderSchema.pre('save', async function (next) {
  if (!this.orderId) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderId = `#${4800 + count + 1}`;
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
