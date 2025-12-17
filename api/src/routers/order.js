const express = require("express");
const Order = require("../models/order");
const { isStaff } = require("../middleware/auth");
const router = new express.Router();

// Створити нове замовлення (публічний маршрут)
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(400).json({ message: error.message || "Bad Request" });
  }
});

// Отримати всі замовлення (публічний для тестування, потім додати isStaff)
router.get("/", async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const orders = await Order.find(filter).sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати замовлення за ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Оновити статус замовлення (з перевіркою ролі, закоментовано для тестування)
router.patch(
  "/:id/status",
  /* isStaff, */ async (req, res) => {
    try {
      const order = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      );
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      res.json(order);
    } catch (error) {
      console.error("Update order status error:", error);
      res.status(400).json({ message: error.message });
    }
  }
);

module.exports = router;
