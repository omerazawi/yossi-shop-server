/* routes/AdminR.js
   ------------------------------------------------------
   ניהול התחברות מנהל + עדכון פרטי-מנהל
   JWT בתוקף - 30 יום  |  verifyToken middleware
------------------------------------------------------ */
const express  = require("express");
const bcrypt   = require("bcrypt");
const jwt      = require("jsonwebtoken");
const Admin    = require("../models/AdminModel");
const { config } = require("../config/secret");
const router   = express.Router();

/* helper – יוצר JWT ל-30 יום */
const genToken = ({ _id, username }) =>
  jwt.sign({ id: _id, username }, config.jwtSecret, { expiresIn: "30d" });

/* ────────────────  Middleware  ──────────────── */
function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "לא מחובר" });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.adminId   = decoded.id;
    next();
  } catch {
    res.status(403).json({ message: "טוקן לא תקף" });
  }
}

/* ────────────────  התחברות  ──────────────── */
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin) return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok)   return res.status(401).json({ message: "שם משתמש או סיסמה שגויים" });

    res.json({ token: genToken(admin) });
  } catch (e) {
    res.status(500).json({ message: "שגיאה בשרת", error: e.message });
  }
});

/* ────────────────  עדכון פרטי-מנהל  ──────────────── */
router.put("/update", verifyToken, async (req, res) => {
  const { newUsername, newPassword } = req.body;
  try {
    const hash = await bcrypt.hash(newPassword, 10);
    await Admin.findByIdAndUpdate(req.adminId,
      { username: newUsername, password: hash },
      { new: true }
    );

    const updated = await Admin.findById(req.adminId);
    res.json({ token: genToken(updated) });   // מחזירים טוקן חדש
  } catch (e) {
    res.status(500).json({ message: "שגיאה בעדכון", error: e.message });
  }
});

module.exports = router;
