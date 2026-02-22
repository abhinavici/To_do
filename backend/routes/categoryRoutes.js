const express = require("express");
const protect = require("../middleware/authMiddleware");
const Category = require("../models/Category");

const router = express.Router();

const normalizeCategoryName = (name) => {
  if (typeof name !== "string") {
    return "";
  }

  return name.trim().toLowerCase();
};

router.get("/", protect, async (req, res) => {
  try {
    const categories = await Category.find({ user: req.user })
      .select("_id name createdAt updatedAt")
      .sort({ name: 1 });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { name } = req.body;
    const normalizedName = normalizeCategoryName(name);

    if (!normalizedName) {
      return res.status(400).json({ message: "Category name is required" });
    }

    if (normalizedName.length > 50) {
      return res.status(400).json({ message: "Category name must be 50 characters or less" });
    }

    const existingCategory = await Category.findOne({
      user: req.user,
      normalizedName,
    });

    if (existingCategory) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await Category.create({
      name: name.trim(),
      normalizedName,
      user: req.user,
    });

    res.status(201).json({
      _id: category._id,
      name: category.name,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
