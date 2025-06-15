const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  images: [{ type: String, required: true }],
  description: { type: String, required: true },
  category: [{ type: String, required: true }],
  price: { type: Number, required: true },
  isAvailable: { type: Boolean, default: true },
  stock: { type: Number },
  sold: { type: Number, default: 0 },
  color: { type: String },
  rating: { type: Number, default: 0 },
  numRatings: { type: Number, default: 0 },

  // מבצע חדש
  onSale: { type: Boolean, default: false },
  discountPercent: { type: Number, default: 0 },
  salePrice: { type: Number }, // לשמירה של המחיר לאחר ההנחה

promotion: {
  type: {
    type: String,
    enum: ['percentage', 'bundle', 'multiToOne'], // סוגי מבצעים
    default: ''
  },
  bundleQuantity: Number,  // למשל 2
  bundlePrice: Number,     // מחיר של 2 מוצרים יחד
  multiToOneQuantity: Number // למשל 2 ב-1 => 2
}
});


ProductSchema.pre('save', function (next) {
  if (this.onSale) {
    if (this.discountPercent > 0) {
      this.salePrice = this.price - (this.price * (this.discountPercent / 100));
    } else if (this.promotion?.type === 'bundle') {
      this.salePrice = this.promotion.bundlePrice; // רק מחזיק מחיר ל-2 יחידות
    } else {
      this.salePrice = undefined;
    }
  } else {
    this.salePrice = undefined;
  }

  next();
});

module.exports.ProductSchema = mongoose.model("Products", ProductSchema);