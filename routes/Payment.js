const express  = require("express");
const router   = express.Router();
const stripe   = require("stripe")(process.env.STRIPE_SECRET_KEY);
const mongoose = require("mongoose");

const { protect } = require("../middlewares/authMiddleware");
const Order    = require("../models/OrdersModel");
const Product  = require("../models/ProductsModel").ProductSchema;
const { v4: uuidv4 } = require("uuid");

/*──────── webhook (RAW) ────────*/
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        process.env.STRIPE_WEBHOOK_SECRET
      );
      if (event.type === "checkout.session.completed")
        await finalizeOrder(event.data.object.id);

      res.json({ received: true });
    } catch (err) {
      console.error("Webhook err:", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
);

/*──────── parsers לשאר הנתיבים ────────*/
router.use(express.json());

/*──────── יצירת Checkout ────────*/
router.post("/create-checkout", protect, async (req, res) => {
  try {
    const {
      cartItems,
      phone,
      address = "",
      deliveryMethod = "משלוח",
      mergeWithOrderId,
    } = req.body;

    if (!Array.isArray(cartItems) || !cartItems.length)
      return res.status(400).json({ error: "cartItems missing" });

    let order;

    /* ---- מיזוג להזמנה קיימת ---- */
    if (mergeWithOrderId) {
      order = await Order.findOne({
        _id: mergeWithOrderId,
        userId: req.user._id,
      });
      if (!order) return res.status(404).json({ error: "Order to merge not found" });

      const map = new Map();
      [...order.cartItems, ...cartItems].forEach((i) => {
        const k = String(i.productId);
        if (map.has(k)) map.get(k).quantity += i.quantity;
        else map.set(k, { ...i });
      });

      order.cartItems      = Array.from(map.values());
      order.total          = order.cartItems.reduce((s, i) => s + i.finalPrice * i.quantity, 0);
      order.phone          = phone;
      order.address        = address;
      order.deliveryMethod = deliveryMethod;
      order.status         = "ממתינה";
      await order.save();
    } else {
      /* ---- הזמנה חדשה ---- */
      order = await Order.create({
        userId: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        phone,
        address,
        deliveryMethod,
        cartItems,
        total: cartItems.reduce((s, i) => s + i.finalPrice * i.quantity, 0),
        orderId: `ORD-${uuidv4().slice(0, 8).toUpperCase()}`,
        status: "ממתינה",
      });
    }

    /* ---- יצירת Session ---- */
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      payment_method_types: ["card"],
      line_items: order.cartItems.map((i) => ({
        price_data: {
          currency: "ils",
          unit_amount: Math.round(i.finalPrice * 100),
          product_data: { name: i.name },
        },
        quantity: i.quantity,
      })),
      success_url: "https://yossi-shop.netlify.app/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "https://yossi-shop.netlify.app/cancel",
      metadata: { orderId: order._id.toString() },
    });

    order.stripeSessionId = session.id;
    await order.save();

    res.json({ url: session.url });
  } catch (err) {
    console.error("create-checkout error:", err);
    res.status(500).json({ error: "Checkout error" });
  }
});

/*──────── confirm – fallback בלוקאל ────────*/
router.post("/confirm", protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    await finalizeOrder(sessionId);
    res.json({ ok: true });
  } catch (err) {
    console.error("confirm error:", err);
    res.status(500).json({ error: "Confirm error" });
  }
});

/*──────── finalizeOrder ────────*/
async function finalizeOrder(sessionId) {
  const order = await Order.findOne({ stripeSessionId: sessionId });
  if (!order) return false;
  if (order.status !== "ממתינה") return true;   // כבר עודכן

  order.status = "ממתינה";
  await order.save();

  /* איחוד כמויות לפי productId (כ־string) */
  const qtyMap = {};
  order.cartItems.forEach(it => {
    const k = String(it.productId);             // ← מפתח אחיד
    qtyMap[k] = (qtyMap[k] || 0) + it.quantity;
  });

  const bulk = Object.entries(qtyMap).map(([pid, qty]) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(pid) },
      update: { $inc: { sold: qty } }
    }
  }));
  const resBulk = await Product.bulkWrite(bulk);
  console.log("sold updated:", resBulk.modifiedCount, "products");

  return true;
}

module.exports = router;
