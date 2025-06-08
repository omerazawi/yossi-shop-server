const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema({
name:{type: String, required: true},
images: [{ type: String, required: true }],
description:{type: String, required: true},
category:[{type:String, required: true}],
price:{type:Number, required: true},
onSale: { type: Boolean, default: false },      
discountPercent: { type: Number, default: 0 }, 
isAvailable: { type: Boolean, default: true },
stock: { type: Number },
sold: { type: Number, default: 0 },
color:{type:String},
rating: { type: Number, default: 0 },
numRatings: { type: Number, default: 0 }
});


ProductSchema.pre('save', function (next) {
    // חישוב מחיר הנחה לפני שמירה
    if (this.onSale && this.discountPercent > 0) {
        this.salePrice = this.price - (this.price * (this.discountPercent / 100));
    } else {
        this.salePrice = undefined; // אין מבצע
    }
    next();
});

module.exports.ProductSchema = mongoose.model("Products", ProductSchema);