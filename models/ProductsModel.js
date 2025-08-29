// server/models/ProductsModel.js
const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  images:      [{ type: String, required: true }],
  description: { type: String, required: true },
  category:    [{ type: String, required: true }],
  price:       { type: Number, required: true },

  isAvailable: { type: Boolean, default: true },
  stock:       { type: Number },
  sold:        { type: Number, default: 0 },
  color:       { type: String },

  rating:     { type: Number, default: 0 },
  numRatings: { type: Number, default: 0 },

  onSale:          { type: Boolean, default: false },
  discountPercent: { type: Number, default: 0 },
  salePrice:       { type: Number }, // לשימוש רק באחוזי הנחה

  promotion: {
    type: {
      type: String,
      enum: ["percentage", "bundle", "multiToOne"],
      required: false,
    },
    bundleQuantity:     Number, // לדוגמה: 3
    bundlePrice:        Number, // לדוגמה: 30
    multiToOneQuantity: Number, // לדוגמה: 3 (3 במחיר 1)
  },
});

/* helper */
function computeSalePriceForPercentage({ price, onSale, discountPercent, promotion }) {
  const isPercentage = onSale && promotion?.type === "percentage" && Number(discountPercent) > 0;
  if (!isPercentage) return undefined;
  const p = Number(price) || 0;
  const d = Number(discountPercent) || 0;
  return Math.round((p * (1 - d / 100)) * 100) / 100;
}

/* שמירה – מחשב salePrice רק לאחוזי הנחה */
ProductSchema.pre("save", function (next) {
  this.salePrice = computeSalePriceForPercentage(this);
  next();
});

/* עדכון findOneAndUpdate – מסנכרן salePrice */
ProductSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate() || {};
  // מאחדים $set אם יש
  const $set = update.$set || {};
  const merged = { ...update, ...$set };

  const salePrice = computeSalePriceForPercentage({
    price: merged.price,
    onSale: merged.onSale,
    discountPercent: merged.discountPercent,
    promotion: merged.promotion,
  });

  if (update.$set) update.$set.salePrice = salePrice;
  else update.salePrice = salePrice;

  this.setUpdate(update);
  next();
});

module.exports.ProductSchema = mongoose.model("Products", ProductSchema);
