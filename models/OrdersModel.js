const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customerEmail: { type: String, required: true },
  products: [
    {
      productId: mongoose.Schema.Types.ObjectId,
      name: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', OrderSchema);
