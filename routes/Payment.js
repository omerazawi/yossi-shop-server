const express = require("express");
const {config} = require('../config/secret');
const Stripe = require('stripe');
const {} = require('../models/OrdersModel');
const stripe = Stripe(config.stripeSecret);
const router = express.Router();

router.post('/create-checkout', async (req, res) => {
  const { cartItems } = req.body;

  const line_items = cartItems.map((item) => ({
    price_data: {
      currency: 'ils',
      product_data: {
        name: item.name,
      },
      unit_amount: item.price * 100, // מחיר באגורות
    },
    quantity: item.quantity,
  }));

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      success_url: 'http://localhost:5173/success',
      cancel_url: 'http://localhost:5173/cancel',
    });

    res.json({ url: session.url });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/webhook', express.raw({ type: 'application/json' }),async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, config.endpointSecret);
    } catch (err) {
      console.error('⚠️ Webhook Error:', err.message);
      return response.status(400).send(`Webhook Error: ${err.message}`);
    }
  
    // טיפוס האירוע – תשלום הושלם
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
  
      // כאן תוכל לשמור למסד הנתונים את ההזמנה:
      const customerEmail = session.customer_details.email;
      const totalAmount = session.amount_total / 100;
  
      console.log('💰 תשלום הצליח מ:', customerEmail, 'סכום:', totalAmount);
      await OrderSchema.create({
        customerEmail,
        products: session.metadata.products ? JSON.parse(session.metadata.products) : [],
        totalAmount
      });
  
      // לדוגמה: שמור למסד הנתונים
    }
  
    response.status(200).end();
  });

  module.exports = router;