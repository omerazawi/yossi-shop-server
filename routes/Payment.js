const express  = require("express");
const router   = express.Router();
const stripe   = require("stripe")(process.env.STRIPE_SECRET_KEY);
const { protect } = require("../middlewares/authMiddleware");
const Order    = require("../models/OrdersModel");
const { v4: uuidv4 } = require("uuid");

/* יצירת Checkout – רק למשתמש מחובר */
router.post("/create-checkout", protect, async (req, res) => {
  const { cartItems, total, phone, address } = req.body;

  const orderId = `ORD-${uuidv4().slice(0, 8).toUpperCase()}`;
  const newOrder = await Order.create({
    userId:  req.user._id,
    fullName:req.user.fullName,
    email:   req.user.email,
    phone, address,
    cartItems, total, orderId,
    status:  "ממתינה"
  });

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: cartItems.map(i => ({
      price_data: {
        currency: "ils",
        unit_amount: Math.round(i.finalPrice * 100),
        product_data: { name: i.name }
      },
      quantity: i.quantity
    })),
    mode: "payment",
    success_url: "http://localhost:5174/success",
    cancel_url:  "http://localhost:5174/cancel",
    customer_email: req.user.email,
    metadata: { orderId: newOrder._id.toString() }
  });

  newOrder.stripeSessionId = session.id;
  await newOrder.save();

  res.json({ url: session.url });
});

module.exports = router;
