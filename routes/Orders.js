const express = require('express');
const router = express.Router();
const Order = require('../models/OrdersModel');
const nodemailer = require('nodemailer');

const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `ORD-${timestamp}-${randomStr}`.toUpperCase();
};

// שליחת מייל
const sendOrderEmail = async (email, fullName, order) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // מומלץ להשתמש בסיסמה לאפליקציה
    },
  });

  const itemsList = order.cartItems.map(item =>
    `<li>${item.name} - כמות: ${item.quantity} - מחיר ליחידה: ₪${item.finalPrice}</li>`
  ).join('');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: `פרטי הזמנה שלך - ${order.orderId}`,
    html: `
      <h3>שלום ${fullName},</h3>
      <p>להלן פרטי ההזמנה שלך:</p>
      <ul>${itemsList}</ul>
      <p><strong>סה״כ לתשלום:</strong> ₪${order.total.toFixed(2)}</p>
      <p><strong>כתובת למשלוח:</strong> ${order.address}</p>
      <p>תודה שקנית אצלנו!</p>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// בדיקת הזמנה קיימת לפי שם או טלפון
router.post('/check-existing', async (req, res) => {
  const { fullName, phone } = req.body;
  try {
    const existing = await Order.findOne({ $or: [{ fullName }, { phone }] }).sort({ createdAt: -1 });
    if (existing) {
      return res.json({ existingOrderId: existing._id });
    }
    res.json({});
  } catch (err) {
    console.error('שגיאה בבדיקת הזמנה קיימת:', err.message);
    res.status(500).json({ error: 'שגיאה בבדיקה' });
  }
});

// יצירת הזמנה או צירוף להזמנה קיימת
router.post('/', async (req, res) => {
  try {
    const { mergeWithOrderId, ...orderData } = req.body;
    let savedOrder;

    if (mergeWithOrderId) {
      const existingOrder = await Order.findById(mergeWithOrderId);
      if (!existingOrder) {
        return res.status(404).json({ error: 'ההזמנה לצירוף לא נמצאה' });
      }

      // איחוד פריטים
      const itemMap = new Map();
      [...existingOrder.cartItems, ...orderData.cartItems].forEach(item => {
        const key = item.productId;
        if (itemMap.has(key)) {
          const existing = itemMap.get(key);
          existing.quantity += item.quantity;
        } else {
          itemMap.set(key, { ...item });
        }
      });

const updatedFields = {
  cartItems: Array.from(itemMap.values()),
  total: existingOrder.total + orderData.total,
  email: orderData.email,
  phone: orderData.phone,
  fullName: orderData.fullName,
  address: orderData.address,
};

savedOrder = await Order.findByIdAndUpdate(
  mergeWithOrderId,
  { $set: updatedFields },
  { new: true }
);
    } else {
      const newOrder = new Order({
        ...orderData,
        orderId: generateOrderId(),
      });
      savedOrder = await newOrder.save();
    }

    // שליחת מייל
    await sendOrderEmail(savedOrder.email, savedOrder.fullName, savedOrder);
    res.status(201).json(savedOrder);
  } catch (error) {
    console.error('שגיאה בשמירת ההזמנה או שליחת מייל:', error.message);
    res.status(500).json({ error: 'שגיאה בשמירה או שליחה', details: error.message });
  }
});

// מחיקה
router.delete('/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'ההזמנה נמחקה' });
  } catch (err) {
    res.status(500).json({ error: 'שגיאה במחיקה' });
  }
});

// עדכון
router.put('/:id', async (req, res) => {
  try {
    const updatedOrder = await Order.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בעדכון' });
  }
});

// קבלת כל ההזמנות
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'שגיאה בקבלת הזמנות' });
  }
});

module.exports = router;
