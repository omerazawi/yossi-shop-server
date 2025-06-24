const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, unique: true, required: true }, // מזהה ייחודי להזמנה
  email: { type: String, required: true },
  userId: String,
  fullName: String,
  phone: String,
  address: String,
  total: { type: Number, required: true },
  cartItems: [
    {
      productId: String,
      name: String,
      quantity: Number,
      finalPrice: Number,
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Order', OrderSchema);
