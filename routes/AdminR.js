const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const AdminSchema = require('../models/AdminModel');
const {config} = require('../config/secret')
const router = express.Router();




function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: 'לא מחובר' });
console.log('adminId:', req.adminId);
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.adminId = decoded.id;
    next();
  } catch {
    res.status(403).json({ message: 'טוקן לא תקף' });
  }
}


router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const admin = await AdminSchema.findOne({ username });
    if (!admin) return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) return res.status(401).json({ message: 'שם משתמש או סיסמה שגויים' });

    const token = jwt.sign({ id: admin._id, username: admin.username }, config.jwtSecret, {
      expiresIn: '3h',
    });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשרת', error: err.message });
  }
});

// עדכון פרטי מנהל
router.put('/update', verifyToken, async (req, res) => {
  const { newUsername, newPassword } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await AdminSchema.findByIdAndUpdate(req.adminId, {
      username: newUsername,
      password: hashedPassword,
    });
    res.json({ message: 'עודכן בהצלחה' });
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בעדכון' });
  }
});



module.exports = router;
