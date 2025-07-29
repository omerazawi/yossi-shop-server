require("dotenv").config();
require("./DB/mongoConnect");
const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");

const paymentRoutes = require("./routes/Payment"); // לוודא שזה הנתיב הנכון
const { routesInit } = require("./routes/config_routes");

const app = express();

const allowedOrigins = [
  'https://yossi-shop.netlify.app',
  'http://localhost:5174',
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

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
