require("dotenv").config();
require("./DB/mongoConnect");
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");

const paymentRoutes = require("./routes/Payment"); // לוודא שזה הנתיב הנכון
const { routesInit } = require("./routes/config_routes");

const app = express();
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

// ⛔️ חובה לפני express.json – עבור Stripe Webhook בלבד:
app.use("/Payment", paymentRoutes);

// ✅ עכשיו מותר להשתמש ב-parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// סטטיים + שאר הראוטים
app.use(express.static(path.join(__dirname, "public")));
routesInit(app); // לא לכלול שוב את Payment כאן

const PORT = process.env.PORT || 3001;
http.createServer(app).listen(PORT, () =>
  console.log(`🟢 Server running on port ${PORT}`)
);
