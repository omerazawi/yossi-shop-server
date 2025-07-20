const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const User = require("../models/UsersModel");
const { verifyAdmin } = require("../middlewares/adminAuth");

/* שליחת מייל איפוס */
async function sendResetEmail(email, fullName, resetUrl) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: `"Yossi Shop" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "איפוס סיסמה - Yossi Shop",
    html: `
      <p>שלום ${fullName},</p>
      <p>קיבלת קישור לאיפוס הסיסמה:</p>
      <a href="${resetUrl}">לחץ כאן לאיפוס הסיסמה</a>
      <p>קישור זה תקף ל-10 דקות בלבד.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

/* כל המשתמשים */
router.get("/", verifyAdmin, async (_req, res) => {
  const users = await User.find().select("-password").sort({ createdAt: -1 });
  res.json(users);
});

/* עדכון משתמש */
router.put("/:id", verifyAdmin, async (req, res) => {
  const { fullName, email } = req.body;
  await User.findByIdAndUpdate(req.params.id, { fullName, email });
  res.json({ message: "עודכן בהצלחה" });
});

/* מחיקת משתמש */
router.delete("/:id", verifyAdmin, async (req, res) => {
  await User.findByIdAndDelete(req.params.id);
  res.json({ message: "המשתמש נמחק" });
});

/* שליחת קישור איפוס סיסמה */
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) return res.status(404).json({ message: "משתמש לא נמצא" });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "10m" });
    const resetUrl = `http://localhost:5173/reset-password/${token}`; // כתובת צד לקוח

    await sendResetEmail(user.email, user.fullName, resetUrl);
    res.json({ message: "קישור איפוס נשלח לאימייל שלך" });

  } catch (err) {
    console.error("שגיאה בשליחת מייל:", err);
    res.status(500).json({ message: "שגיאה בשליחת המייל" });
  }
});

/* איפוס סיסמה בפועל */
router.post("/reset-password/:token", async (req, res) => {
  try {
    const decoded = jwt.verify(req.params.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: "משתמש לא נמצא" });

    user.password = req.body.password; // לא מצפינים ידנית – השמירה תצפין דרך pre('save')
    await user.save();

    res.json({ message: "סיסמה אופסה בהצלחה" });
  } catch {
    res.status(400).json({ message: "קישור שגוי או שפג תוקפו" });
  }
});

module.exports = router;
