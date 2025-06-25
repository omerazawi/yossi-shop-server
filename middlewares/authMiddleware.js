const jwt  = require("jsonwebtoken");
const User = require("../models/UsersModel");

const protect = async (req, res, next) => {
  let token = req.headers.authorization;

  /* חיפוש Bearer בחלק הראשון */
  if (token && token.startsWith("Bearer ")) {
    try {
      token = token.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.userId).select("-password");
      return next();
    } catch {
      return res.status(401).json({ message: "Token invalid" });
    }
  }
  res.status(401).json({ message: "No token" });
};

module.exports = { protect };
