const express  = require("express");
const User = require("../models/UsersModel");
const { verifyAdmin } = require("../middlewares/adminAuth");
const router   = express.Router();

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

module.exports = router;
