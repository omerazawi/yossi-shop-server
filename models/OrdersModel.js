const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId:    { type: String, required: true, unique: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName:   { type: String, required: true },
  email:      { type: String, required: true },
  phone:      { type: String, required: true },
  address:    { type: String, required: true },

  cartItems:  { type: Array,  required: true },
  total:      { type: Number, required: true },

  status: {
    type: String,
    enum: ["ממתינה", "מחכה למשלוח", "נשלחה","בוצעה בהצלחה", "בוטלה"],
    default: "ממתינה",
  },

  stripeSessionId: { type: String },
  createdAt:       { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
