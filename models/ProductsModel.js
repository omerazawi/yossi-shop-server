const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  /* --- שדות בסיס --- */
  name:        { type: String, required: true },
  images:      [{ type: String, required: true }],
  description: { type: String, required: true },
  category:    [{ type: String, required: true }],
  price:       { type: Number, required: true },

  isAvailable: { type: Boolean, default: true },
  stock:       { type: Number },
  sold:        { type: Number, default: 0 },
  color:       { type: String },

  /* --- דירוג --- */
  rating:     { type: Number, default: 0 },
  numRatings: { type: Number, default: 0 },

  /* --- מבצע --- */
  onSale:          { type: Boolean, default: false },
  discountPercent: { type: Number, default: 0 },
  salePrice:       { type: Number },

  promotion: {
    type: {
      type: String,
      enum: ["percentage", "bundle", "multiToOne"], // ⬅️ בלי מחרוזת ריקה
      required: false,                              // ⬅️ לא חובה
    },
    bundleQuantity:     Number,
    bundlePrice:        Number,
    multiToOneQuantity: Number,
  },
});

/* מחשב salePrice לפני save */
ProductSchema.pre("save", function (next) {
  if (this.onSale) {
    if (this.discountPercent > 0) {
      this.salePrice =
        this.price - this.price * (this.discountPercent / 100);
    } else if (this.promotion?.type === "bundle") {
      this.salePrice = this.promotion.bundlePrice;
    } else {
      this.salePrice = undefined;
    }
  } else {
    this.salePrice = undefined;
  }
  next();
});

module.exports.ProductSchema = mongoose.model("Products", ProductSchema);
