// routes/AdminR.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const { config } = require("../config/secret");
const { verifyAdmin } = require("../middlewares/adminAuth");

const router = express.Router();

/* יוצר טוקן עם תוקף ל־30 יום */
const genToken = ({ _id, username }) =>
  jwt.sign({ id: _id, username, role: "admin" }, config.jwtSecret, {
    expiresIn: "30d",
  });

/* ───── התחברות ───── */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await Admin.findOne({ username });
    if (!admin)
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok)
      return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });

    res.json({ token: genToken(admin) });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
});

/* ───── עדכון פרטים ───── */
router.put("/update", verifyAdmin, async (req, res) => {
  const { currentPassword, newUsername, newPassword } = req.body;
  const admin = req.admin;

  try {
    const ok = await bcrypt.compare(currentPassword, admin.password);
    if (!ok)
      return res.status(401).json({ message: "סיסמה נוכחית שגויה" });

    const updateData = {};
    if (newUsername) updateData.username = newUsername;
    if (newPassword)
      updateData.password = await bcrypt.hash(newPassword, 10);

    if (!newUsername && !newPassword)
      return res
        .status(400)
        .json({ message: "לא נבחרו פרטים לעדכון" });

    await Admin.findByIdAndUpdate(admin._id, updateData);
    res.json({ message: "הפרטים עודכנו בהצלחה" });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בעדכון", error: err.message });
  }
});

module.exports = router;
