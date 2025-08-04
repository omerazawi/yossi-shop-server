require("dotenv").config();
require("./DB/mongoConnect");

const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const paymentRoutes = require("./routes/Payment");
const { routesInit } = require("./routes/config_routes");

const app = express();

// CORS - כולל OPTIONS עם הגדרות זהות
const allowedOrigins = [
  "https://yossi-shop.netlify.app",
  "https://yossi-admin.netlify.app",
  "http://localhost:5173",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Blocked by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

// Stripe Webhook – לפני body-parser
app.use("/Payment", paymentRoutes);

// body-parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "200mb" }));

// קבצים סטטיים
app.use(express.static(path.join(__dirname, "public")));

// ראוטים ראשיים
routesInit(app);

const PORT = process.env.PORT || 3001;
http.createServer(app).listen(PORT, () =>
  console.log(`🟢 Server running on port ${PORT}`)
);
