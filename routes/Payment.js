const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

router.post('/create-checkout', async (req, res) => {
  try {
    const { cartItems, total, email } = req.body;

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ error: 'פריטים חסרים או לא תקינים.' });
    }

const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: cartItems.map(item => ({
    price_data: {
      currency: 'ils',
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.finalPrice * 100),
    },
    quantity: item.quantity,
  })),
  mode: 'payment',
  success_url: `http://localhost:5173/success`,
  cancel_url: `http://localhost:5173/cancel`,
  customer_email: email,
});


    res.json({ url: session.url });
  } catch (err) {
    console.error('שגיאה ביצירת session:', err.message);
    res.status(500).json({ error: 'שגיאה בעת יצירת תשלום.' });
  }
});

module.exports = router;
