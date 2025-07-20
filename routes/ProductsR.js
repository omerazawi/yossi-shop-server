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
    const body = { ...req.body };

    /* ---- Normalize promotion.type ---- */
    if (!body.onSale || !body.promotion?.type) {
      delete body.promotion;        // מסיר לגמרי אם ריק
      body.discountPercent = 0;
    }

    const newProduct = new ProductSchema(body);
    await newProduct.save();
    res.status(201).json({ message: "המוצר נוסף בהצלחה!", product: newProduct });
  } catch (err) {
    console.error("שגיאה ביצירת המוצר:", err);
    res.status(500).json({ error: "שגיאה בשרת", details: err.message });
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

    /* אימות מזהה ומספר כוכבים */
    if (!id.match(/^[0-9a-fA-F]{24}$/))
      return res.status(400).json({ message: "מזהה מוצר לא תקף" });
    if (![1, 2, 3, 4, 5].includes(rating))
      return res.status(400).json({ message: "דירוג חייב להיות 1-5" });

    const product = await ProductSchema.findById(id);
    if (!product) return res.status(404).json({ message: "מוצר לא נמצא" });

    const total = product.rating * product.numRatings;
    product.numRatings += 1;
    product.rating = Math.round(((total + rating) / product.numRatings) * 10) / 10;
    await product.save();

    res.json({ rating: product.rating, numRatings: product.numRatings });
  } catch (e) {
    console.error("שגיאה בעדכון דירוג:", e);
    res.status(500).json({ message: "שגיאה בשרת" });
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

router.get("/top-rated", async (_req, res) => {
  const list = await ProductSchema.aggregate([
    {
      $addFields: {
        ratingSum: { $multiply: ["$rating", "$numRatings"] },
      },
    },
    { $sort: { ratingSum: -1 } },
    { $limit: 20 },
  ]);
  res.json(list);
});

/* --- מוצרים נמכרים ביותר --- */
router.get("/top-sold", async (_req, res) => {
  const list = await ProductSchema.find().sort({ sold: -1 }).limit(20);
  res.json(list);
});


module.exports = router;
