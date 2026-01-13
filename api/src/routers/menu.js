const express = require("express");
const MenuItem = require("../models/menuItem");
const User = require("../models/user");
const fs = require('fs');
const path = require('path');
const router = new express.Router();

// Helper функція для видалення файлу зображення
const deleteImageFile = (imageUrl) => {
  if (!imageUrl) return;
  
  const imagePath = path.join(__dirname, '../../uploads', path.basename(imageUrl));
  
  if (fs.existsSync(imagePath)) {
    try {
      fs.unlinkSync(imagePath);
      console.log(`Deleted image file: ${imagePath}`);
      return true;
    } catch (error) {
      console.error(`Failed to delete image file: ${imagePath}`, error);
      return false;
    }
  } else {
    console.log(`Image file not found: ${imagePath}`);
    return false;
  }
};

// Отримати всі товари або фільтрувати
router.get("/", async (req, res) => {
  try {
    const { category, available } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (available === "true") filter.isAvailable = true;

    console.log('Fetching menu items with filter:', filter);
    
    const menuItems = await MenuItem.find(filter).sort({ createdAt: -1 });
    
    console.log(`Found ${menuItems.length} menu items`);
    
    res.json(menuItems);
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати товар за ID
router.get("/:id", async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }
    res.json(menuItem);
  } catch (error) {
    console.error("Get menu item error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Створити новий товар
router.post("/", async (req, res) => {
  try {
    const { adminId, adminRole } = req.body;

    if (!adminId || !adminRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await User.findById(adminId);
    if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const menuItem = new MenuItem({
      ...req.body,
      createdBy: adminId,
    });

    await menuItem.save();
    console.log(`New menu item created: ${menuItem.name} by ${admin.email}`);
    res.status(201).json(menuItem);
  } catch (error) {
    console.error("Create menu item error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Оновити товар
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const { adminId, adminRole } = updates;

    if (!adminId || !adminRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await User.findById(adminId);
    if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const existingItem = await MenuItem.findById(id);
    if (!existingItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Якщо змінюється зображення - видалити старе
    if (updates.imageUrl && existingItem.imageUrl && updates.imageUrl !== existingItem.imageUrl) {
      deleteImageFile(existingItem.imageUrl);
    }

    const allowedUpdates = [
      "name",
      "description",
      "price",
      "image",
      "imageUrl",
      "category",
      "ingredients",
      "weight",
      "weightUnit",
      "isAvailable",
    ];

    const sanitizedUpdates = {};
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        sanitizedUpdates[field] = updates[field];
      }
    });

    const menuItem = await MenuItem.findByIdAndUpdate(id, sanitizedUpdates, {
      new: true,
      runValidators: true,
    });

    console.log(`Menu item updated: ${menuItem.name} by ${admin.email}`);
    res.json(menuItem);
  } catch (error) {
    console.error("Update menu item error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Видалити товар
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, adminRole } = req.body;

    if (!adminId || !adminRole) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const admin = await User.findById(adminId);
    if (!admin || (admin.role !== "admin" && admin.role !== "moderator")) {
      return res.status(403).json({ message: "Access denied" });
    }

    const menuItem = await MenuItem.findById(id);
    if (!menuItem) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    // Видалити фізичний файл
    deleteImageFile(menuItem.imageUrl);

    // Видалити товар з бази даних
    await MenuItem.findByIdAndDelete(id);

    console.log(`Menu item deleted: ${menuItem.name} by ${admin.email}`);
    res.json({ message: "Menu item deleted successfully" });
  } catch (error) {
    console.error("Delete menu item error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
