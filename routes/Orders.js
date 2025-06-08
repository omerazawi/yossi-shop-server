const express = require("express");
const OrderSchema = require('../models/OrdersModel');
const router = express.Router();

router.post('/new', async (req, res) => {
  try {
    const { cartItems, address, totalPrice, userId, customerEmail } = req.body;

    if (!totalPrice || !customerEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const order = new OrderSchema({
      products: cartItems,
      address,
      totalAmount: totalPrice,
      user: userId,
      customerEmail, // ודא שזה נמצא
      createdAt: new Date(),
    });

    await order.save();
    res.status(201).json(order);
  } catch (err) {
    console.error('Error saving order:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});


module.exports = router;