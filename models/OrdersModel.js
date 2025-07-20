const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  orderId:    { type: String, required: true, unique: true },
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  fullName:   { type: String, required: true },
  email:      { type: String, required: true },
  phone:      { type: String, required: true },

  /* — שיטת אספקה — */
  deliveryMethod: {
    type: String,
    enum: ["משלוח", "איסוף עצמי"],
    required: true,
    default: "משלוח",
  },

  /* כתובת חובה רק אם נבחרה אפשרות משלוח */
  address: {
    type: String,
    required() { return this.deliveryMethod === "משלוח"; },
  },

  cartItems: { type: Array,  required: true },
  total:     { type: Number, required: true },

  status: {
    type: String,
    enum: ["ממתינה", "מחכה למשלוח", "נשלחה", "בוצעה בהצלחה", "בוטלה"],
    default: "ממתינה",
  },

  stripeSessionId: { type: String },
  createdAt:       { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", OrderSchema);
