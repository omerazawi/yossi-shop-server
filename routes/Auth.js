const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/UsersModel");
const { protect } = require("../middlewares/authMiddleware");
const router = express.Router();

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

// הרשמה
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "משתמש כבר קיים" });

    const user = await User.create({ fullName, email, password });
    res.status(201).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
});

// התחברות
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: "אימייל או סיסמה שגויים" });

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      token: generateToken(user._id),
      isAdmin: user.isAdmin,
    });
  } catch (err) {
    res.status(500).json({ message: "שגיאה בשרת", error: err.message });
  }
});

// פרופיל משתמש לפי טוקן
router.get("/profile", protect, async (req, res) => {
  res.json({
    _id: req.user._id,
    fullName: req.user.fullName,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
  });
});

module.exports = router;
