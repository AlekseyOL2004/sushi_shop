const express = require("express");
const MenuItem = require("../models/menuItem");
const { isAdminOrModerator } = require("../middleware/auth");
const router = new express.Router();

// Отримати всі доступні позиції меню (публічний маршрут)
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find({ available: true }).sort({
      createdAt: -1,
    });
    res.json(items);
  } catch (error) {
    console.error("Get menu items error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Створити нову позицію меню (публічний для тестування, потім додати isAdminOrModerator)
router.post(
  "/",
  /* isAdminOrModerator, */ async (req, res) => {
    try {
      const item = new MenuItem(req.body);
      await item.save();
      res.status(201).json(item);
    } catch (error) {
      console.error("Create menu item error:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Оновити позицію меню (публічний для тестування, потім додати isAdminOrModerator)
router.patch(
  "/:id",
  /* isAdminOrModerator, */ async (req, res) => {
    try {
      const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json(item);
    } catch (error) {
      console.error("Update menu item error:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

// Видалити позицію меню (soft delete) (публічний для тестування, потім додати isAdminOrModerator)
router.delete(
  "/:id",
  /* isAdminOrModerator, */ async (req, res) => {
    try {
      const item = await MenuItem.findByIdAndUpdate(
        req.params.id,
        { available: false },
        { new: true }
      );
      if (!item) return res.status(404).json({ message: "Item not found" });
      res.json({ message: "Item deleted successfully" });
    } catch (error) {
      console.error("Delete menu item error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
