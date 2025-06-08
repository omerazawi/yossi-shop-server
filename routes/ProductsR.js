const express = require("express");
const { ProductSchema } = require('../models/ProductsModel');

const router = express.Router();


router.get("/", async (req, res) => {
  try {
    const products = await ProductSchema.find({});
    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בשרת", details: err.message });
  }
});

// Add a new product
router.post("/add", async (req, res) => {
  try {
    const newProduct = new ProductSchema(req.body);
    await newProduct.save();
    res.status(201).json({ message: "המוצר נוסף בהצלחה!", product: newProduct });
  } catch (error) {
    console.error("שגיאה ביצירת המוצר:", error);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

// Delete a single product
router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await ProductSchema.findByIdAndDelete(id);
    if (!deletedProduct) {
      return res.status(404).json({ message: "המוצר לא נמצא" });
    }
    res.status(200).json({ message: "המוצר נמחק בהצלחה" });
  } catch (error) {
    console.error("שגיאה במחיקת המוצר:", error);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

// Delete multiple products
router.post("/delete-multiple", async (req, res) => {
  try {
    const { productIds } = req.body;
    const result = await ProductSchema.deleteMany({ _id: { $in: productIds } });
    res.status(200).json({ message: "המוצרים נמחקו בהצלחה", deletedCount: result.deletedCount });
  } catch (error) {
    console.error("שגיאה במחיקת המוצרים:", error);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

// עדכון מוצר
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const productData = req.body;

    // חישוב מחיר מבצע בצד שרת
    if (productData.onSale && productData.discountPercent) {
      const discountAmount = (productData.price * productData.discountPercent) / 100;
      productData.salePrice = Math.round((productData.price - discountAmount) * 100) / 100;
    } else {
      productData.salePrice = undefined;
    }

    const updatedProduct = await ProductSchema.findByIdAndUpdate(id, productData, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "המוצר לא נמצא" });
    }

    res.status(200).json({ message: "המוצר עודכן בהצלחה", product: updatedProduct });
  } catch (error) {
    console.error("שגיאה בעדכון המוצר:", error);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

// דירוג מוצר
router.post("/rate/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { rating } = req.body;

    // בדיקה שהדירוג תקין
    if (typeof rating !== "number" || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "דירוג לא תקין. יש לשלוח מספר בין 1 ל-5." });
    }

    const product = await ProductSchema.findById(id);
    if (!product) {
      return res.status(404).json({ message: "המוצר לא נמצא" });
    }

    // חישוב ממוצע חדש
    const totalRating = (product.rating || 0) * (product.numRatings || 0);
    const newNumRatings = (product.numRatings || 0) + 1;
    const newAverageRating = (totalRating + rating) / newNumRatings;

    product.rating = Math.round(newAverageRating * 10) / 10; // עיגול ל-1 ספרה אחרי הנקודה
    product.numRatings = newNumRatings;

    await product.save();

    res.status(200).json({ message: "הדירוג עודכן בהצלחה", rating: product.rating, numRatings: product.numRatings });
  } catch (error) {
    console.error("שגיאה בעדכון דירוג:", error);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

router.get("/ratings", async (req, res) => {
  try {
    const products = await ProductSchema.find({}, '_id rating numRatings'); // שליפת שדות מסוימים בלבד

    const ratingsData = {};
    products.forEach(product => {
      ratingsData[product._id] = {
        rating: product.rating || 0,
        numRatings: product.numRatings || 0
      };
    });

    res.status(200).json(ratingsData);
  } catch (error) {
    console.error("שגיאה בקבלת דירוגים:", error);
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});


module.exports = router;
