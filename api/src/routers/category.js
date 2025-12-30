const express = require("express");
const Category = require("../models/category");
const router = new express.Router();

// Отримати всі категорії
router.get("/", async (req, res) => {
  try {
    const { active } = req.query;
    let query = {};

    if (active !== undefined) query.isActive = active === "true";

    const categories = await Category.find(query).sort({ createdAt: 1 });
    res.json(categories);
  } catch (error) {
    console.error("Get categories error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати категорію за ID
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (error) {
    console.error("Get category error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Створити нову категорію (тільки адмін/модератор)
router.post("/", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || !["admin", "moderator"].includes(adminRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const category = new Category({
      key: req.body.key,
      label: req.body.label,
      icon: req.body.icon,
      color: req.body.color,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      createdBy: adminId,
    });

    await category.save();
    console.log(`✅ Category created: ${category.label} by ${adminId}`);
    res.status(201).json(category);
  } catch (error) {
    console.error("Create category error:", error);
    if (error.code === 11000) {
      return res.status(400).json({ message: "Category key already exists" });
    }
    res.status(400).json({ message: error.message });
  }
});

// Оновити категорію (тільки адмін/модератор)
router.patch("/:id", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || !["admin", "moderator"].includes(adminRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const updates = {};
    const allowedUpdates = ["label", "icon", "color", "isActive"];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    updates.updatedAt = Date.now();

    const category = await Category.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    console.log(`✅ Category updated: ${category.label} by ${adminId}`);
    res.json(category);
  } catch (error) {
    console.error("Update category error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Видалити категорію (тільки адмін)
router.delete("/:id", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || adminRole !== "admin") {
      return res
        .status(403)
        .json({ message: "Only admins can delete categories" });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    console.log(`✅ Category deleted: ${category.label} by ${adminId}`);
    res.json({
      message: "Category deleted successfully",
      deletedCategory: category,
    });
  } catch (error) {
    console.error("Delete category error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
