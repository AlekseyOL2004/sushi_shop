const express = require("express");
const Menu = require("../models/menu");
const router = new express.Router();

// Отримати всі товари
router.get("/", async (req, res) => {
  try {
    const { category, available } = req.query;
    let query = {};

    if (category) query.category = category;
    if (available !== undefined) query.isAvailable = available === "true";

    const menuItems = await Menu.find(query).sort({ createdAt: -1 });
    res.json(menuItems);
  } catch (error) {
    console.error("Get menu error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати товар за ID
router.get("/:id", async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    res.json(item);
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Створити новий товар (тільки адмін/модератор)
router.post("/", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || !["admin", "moderator"].includes(adminRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const menuItem = new Menu({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      image: req.body.image || "🍣",
      category: req.body.category || "rolls",
      ingredients: req.body.ingredients,
      weight: req.body.weight,
      weightUnit: req.body.weightUnit || "g",
      isAvailable:
        req.body.isAvailable !== undefined ? req.body.isAvailable : true,
      createdBy: adminId,
    });

    await menuItem.save();
    console.log(`✅ Menu item created: ${menuItem.name} by ${adminId}`);
    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Оновити товар (тільки адмін/модератор)
router.patch("/:id", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || !["admin", "moderator"].includes(adminRole)) {
      return res.status(403).json({ message: "Access denied" });
    }

    console.log("=== UPDATE MENU ITEM ===");
    console.log("Item ID:", req.params.id);
    console.log("Request body:", req.body);

    const updates = {};
    const allowedUpdates = [
      "name",
      "description",
      "price",
      "image",
      "category",
      "ingredients",
      "weight",
      "weightUnit",
      "isAvailable",
    ];

    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        console.log(`Update field ${field}:`, req.body[field]);
      }
    });

    updates.updatedAt = Date.now();

    console.log("Final updates:", updates);

    const menuItem = await Menu.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!menuItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    console.log(`✅ Menu item updated: ${menuItem.name} by ${adminId}`);
    console.log("Updated item:", menuItem);
    res.json(menuItem);
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Видалити товар (тільки адмін)
router.delete("/:id", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || adminRole !== "admin") {
      return res.status(403).json({ message: "Only admins can delete items" });
    }

    const menuItem = await Menu.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ message: "Item not found" });
    }

    console.log(`✅ Menu item deleted: ${menuItem.name} by ${adminId}`);
    res.json({ message: "Item deleted successfully", deletedItem: menuItem });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
