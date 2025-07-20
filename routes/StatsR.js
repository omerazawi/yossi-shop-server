const express  = require("express");
const router   = express.Router();
const Stats    = require("../models/StatsModel");
const Order    = require("../models/OrdersModel");
const Product  = require("../models/ProductsModel").ProductSchema;
const { verifyAdmin } = require("../middlewares/adminAuth");

/* ───── ספירת כניסה מהצד-לקוח ───── */
router.post("/visit", async (_req, res) => {
  await Stats.findOneAndUpdate(
    { key: "visits" },
    { $inc: { value: 1 } },
    { upsert: true, new: true }
  );
  res.json({ ok: true });
});

/* ───── סטטיסטיקות למנהל ───── */
router.get("/admin", verifyAdmin, async (_req, res) => {
  try {
    /* הזמנות */
    const deliveries = await Order.countDocuments({ deliveryMethod: "משלוח" });
    const pickups    = await Order.countDocuments({ deliveryMethod: "איסוף עצמי" });
    const pending    = await Order.countDocuments({ status: "ממתינה" });

    /* מוצרים */
    const productsCount = await Product.countDocuments();

    /* מכירות – סכום שדה sold בכל מוצר */
    const soldAgg = await Product.aggregate([
      { $group: { _id: null, qty: { $sum: "$sold" } } },
    ]);
    const soldQty = soldAgg[0]?.qty || 0;

    /* ביקורים */
    const visitsDoc = await Stats.findOne({ key: "visits" });
    const visits    = visitsDoc?.value || 0;

    res.json({ deliveries, pickups, pending, soldQty, productsCount, visits });
  } catch (e) {
    console.error("stats error:", e);
    res.status(500).json({ error: "Stats error" });
  }
});

module.exports = router;