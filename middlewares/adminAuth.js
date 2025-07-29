// middlewares/adminAuth.js
const jwt = require("jsonwebtoken");
const Admin = require("../models/AdminModel");
const { config } = require("../config/secret");

const verifyAdmin = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "אין טוקן מנהל" });

  try {
    const decoded = jwt.verify(token, config.jwtSecret);

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "גישה אסורה - לא מנהל" });
    }

    const admin = await Admin.findById(decoded.id);
    if (!admin) return res.status(401).json({ message: "Admin לא קיים" });

    req.admin = admin;
    next();
  } catch (err) {
    console.error("JWT Error:", err.message);
    res.status(403).json({ message: "טוקן מנהל לא תקף" });
  }
};

module.exports = { verifyAdmin };
