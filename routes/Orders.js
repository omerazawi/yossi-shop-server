const express  = require("express");
const router   = express.Router();
const Order    = require("../models/OrdersModel");
const nodemailer = require("nodemailer");
const { protect }     = require("../middlewares/authMiddleware");
const { verifyAdmin } = require("../middlewares/adminAuth");
const { prepareItemsWithFinalPrice, calcTotal } = require("../utils/priceUtils");

/* עזר */
const generateOrderId = () =>
  `ORD-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 6)}`.toUpperCase();

const sendOrderEmail = async (email, fullName, order) => {
  if (!email) return;                       // אין נמען – לא שולחים
  const tr = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });

  const itemsHtml = order.cartItems
    .map((i) => `<li>${i.name} – ${i.quantity} × ₪${i.finalPrice}</li>`)
    .join("");

  await tr.sendMail({
    from: process.env.EMAIL_USER,
    to:   email,
    subject: `הזמנתך – ${order.orderId}`,
    html: `
      <h3>שלום ${fullName},</h3>
      <p>תודה שהזמנת מ-Yossi Shop.</p>
      <ul>${itemsHtml}</ul>
      <p><strong>סה״כ:</strong> ₪${order.total.toFixed(2)}</p>
      <p><strong>כתובת למשלוח:</strong> ${order.address}</p>
    `,
  });
};

/* בדיקה להזמנה קיימת */
router.post("/check-existing", async (req, res) => {
  const { phone } = req.body;
  try {
    const existing = await Order.findOne({ phone }).sort({ createdAt: -1 });
    existing
      ? res.json({ existingOrderId: existing._id })
      : res.json({});
  } catch (e) { res.status(500).json({ error: "שגיאה בבדיקה" }); }
});

/* יצירה / מיזוג */
router.post("/", protect, async (req, res) => {
  try {
    const { mergeWithOrderId, cartItems, phone, address } = req.body;

    /* השלמת פרטי משתמש */
    const base = {
      fullName: req.user.fullName,
      email:    req.user.email,
      phone,
      address,
    };

    const prepped = prepareItemsWithFinalPrice(cartItems);
    const total   = calcTotal(prepped);

    let saved;
    if (mergeWithOrderId) {
      /* מיזוג לעגלה קיימת */
      const exist = await Order.findById(mergeWithOrderId);
      if (!exist) return res.status(404).json({ message: "לא נמצאה הזמנה למיזוג" });

      /* חיבור פריטים */
      const map = new Map();
      [...exist.cartItems, ...prepped].forEach((i) => {
        const k = i.productId;
        if (map.has(k)) map.get(k).quantity += i.quantity;
        else map.set(k, { ...i });
      });

      exist.cartItems = Array.from(map.values());
      exist.total     = calcTotal(exist.cartItems);
      await exist.save();
      saved = exist;
    } else {
      saved = await Order.create({
        ...base,
        cartItems: prepped,
        total,
        orderId: generateOrderId(),
        userId: req.user._id,
        status: "ממתינה",
      });
    }

    await sendOrderEmail(saved.email, saved.fullName, saved);
    res.status(201).json(saved);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "שגיאה בשמירת הזמנה" });
  }
});

/* שינוי סטטוס – בעל ההזמנה */
router.put("/status/:id", protect, async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: "לא נמצא" });
  if (!order.userId.equals(req.user._id))
    return res.status(403).json({ message: "אין הרשאה" });

  order.status = req.body.status;
  await order.save();
  res.json(order);
});

/* הזמנות המשתמש */
router.get("/my-orders", protect, async (req, res) => {
  const orders = await Order.find({ userId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

/* ----- ניהול (Admin) ----- */
router.get("/", verifyAdmin, async (_req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

router.put("/:id", verifyAdmin, async (req, res) => {
  const updated = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

router.delete("/:id", verifyAdmin, async (req, res) => {
  await Order.findByIdAndDelete(req.params.id);
  res.json({ message: "נמחק" });
});

module.exports = router;
