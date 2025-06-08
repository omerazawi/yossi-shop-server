const express = require("express");
const Category = require("../models/CategoryModel");

const router = express.Router();

// קבלת כל הקטגוריות
router.get("/", async (req, res) => {
  try {
    const categories = await Category.find({});
    res.status(200).json(categories);
  } catch (err) {
    res.status(500).json({ error: "שגיאה בשרת", details: err.message });
  }
});


router.post("/add", async (req, res) => {
    try {
      const { name, image } = req.body;
  
      const newCategory = new Category({ name, image });
      await newCategory.save();
  
      res.status(201).json({ message: "קטגוריה נוספה בהצלחה!", category: newCategory });
    } catch (err) {
      res.status(500).json({ error: "שגיאה בשרת", details: err.message });
    }
  });


router.delete("/delete/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCategory = await Category.findByIdAndDelete(id);
    if (!deletedCategory) {
      return res.status(404).json({ message: "הקטגוריה לא נמצאה" });
    }
    res.status(200).json({ message: "הקטגוריה נמחקה בהצלחה" });
  } catch (error) {
    res.status(500).json({ error: "שגיאה בשרת" });
  }
});

// עדכון קטגוריה
router.put("/:id", async (req, res) => {
    try {
      const { name, image } = req.body;
  
      const updatedCategory = await Category.findByIdAndUpdate(
        req.params.id,
        { name, image },
        { new: true }
      );
  
      res.status(200).json({ message: "קטגוריה עודכנה בהצלחה!", category: updatedCategory });
    } catch (err) {
      res.status(500).json({ error: "שגיאה בשרת", details: err.message });
    }
  });

module.exports = router;
