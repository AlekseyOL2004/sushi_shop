const express = require("express");
const Order = require("../models/order");
const User = require("../models/user");
const router = new express.Router();

// Створити нове замовлення (публічний маршрут)
router.post("/", async (req, res) => {
  try {
    const {
      items,
      totalPrice,
      customerName,
      customerPhone,
      customerAddress,
      deliveryType,
      sticksType,
      cutleryCount,
      comment,
      userId,
      bonusRollsUsed,
      birthdayRollUsed,
    } = req.body;

    // Валідація вхідних даних
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Items are required" });
    }

    if (!totalPrice || isNaN(totalPrice)) {
      return res.status(400).json({ message: "Valid totalPrice is required" });
    }

    // Розрахувати кількість балів для нарахування
    // 1 бал = 100 грн (2 знаки після коми)
    let bonusPointsEarned = 0;
    if (userId) {
      // Округлення до 2 знаків після коми
      bonusPointsEarned = Math.floor((totalPrice / 100) * 100) / 100; //  200) * 100) / 100;
    }
// Test 3
    const order = new Order({
      items,
      totalPrice,
      customerName,
      customerPhone,
      customerAddress,
      deliveryType: deliveryType || "delivery",
      sticksType,
      cutleryCount: cutleryCount || 1,
      comment,
      userId: userId || null,
      bonusPointsEarned,
      bonusRollsUsed: bonusRollsUsed || 0,
      birthdayRollUsed: birthdayRollUsed || false,
      status: "pending",
      statusHistory: [
        {
          status: "pending",
          timestamp: new Date(),
        },
      ],
    });

    await order.save();

    // Нарахувати бонусні бали користувачу
    if (userId && bonusPointsEarned > 0) {
      const user = await User.findById(userId);
      if (user) {
        let newBonusPoints = (user.bonusPoints || 0) + bonusPointsEarned;

        // Списати використані бонусні роли
        if (bonusRollsUsed > 0) {
          const pointsToDeduct = bonusRollsUsed * 20;
          newBonusPoints = newBonusPoints - pointsToDeduct;
        }

        // Округлення до 2 знаків після коми
        user.bonusPoints = Math.max(0, Math.round(newBonusPoints * 100) / 100);

        await user.save();
        console.log(
          `User ${user.email} earned ${bonusPointsEarned} bonus points. Total: ${user.bonusPoints}`
        );
      }
    }

    console.log("Order created successfully:", order._id);
    res.json(order);
  } catch (error) {
    console.error("Create order error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Отримати всі замовлення
router.get("/", async (req, res) => {
  try {
    const { status, userId, managerId } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (managerId) filter.managerId = managerId;

    const orders = await Order.find(filter)
      .populate("userId", "firstName lastName email")
      .populate("managerId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get orders error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Отримати замовлення за ID
router.get("/:id", async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("userId", "firstName lastName email phone")
      .populate("managerId", "firstName lastName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.json(order);
  } catch (error) {
    console.error("Get order by ID error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Оновити статус замовлення
router.patch("/:id/status", async (req, res) => {
  try {
    const { status, managerId } = req.body;

    if (!managerId) {
      return res.status(400).json({ message: "Manager ID required" });
    }

    const manager = await User.findById(managerId);
    if (!manager) {
      return res.status(404).json({ message: "Manager not found" });
    }

    if (!["manager", "moderator", "admin"].includes(manager.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const validStatuses = [
      "processing",
      "confirmed",
      "preparing",
      "ready",
      "delivering",
      "completed",
      "cancelled",
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // Оновити статус
    order.status = status;
    order.managerId = managerId;

    // Додати в історію тільки якщо статус змінився
    const lastHistoryStatus =
      order.statusHistory.length > 0
        ? order.statusHistory[order.statusHistory.length - 1].status
        : null;

    if (lastHistoryStatus !== status) {
      order.statusHistory.push({
        status,
        timestamp: new Date(),
        updatedBy: managerId,
      });
    }

    await order.save();

    const updatedOrder = await Order.findById(order._id)
      .populate("userId", "firstName lastName email")
      .populate("managerId", "firstName lastName");

    console.log(
      `Order ${order._id} status changed to ${status} by ${manager.email}`
    );
    res.json(updatedOrder);
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Призначити менеджера
router.patch("/:id/assign", async (req, res) => {
  try {
    const { managerId } = req.body;

    const manager = await User.findById(managerId);
    if (!manager || !["manager", "moderator", "admin"].includes(manager.role)) {
      return res.status(400).json({ message: "Invalid manager" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { managerId },
      { new: true }
    ).populate("managerId", "firstName lastName");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (error) {
    console.error("Assign manager error:", error);
    res.status(400).json({ message: error.message });
  }
});

// Отримати замовлення користувача
router.get("/user/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .populate("managerId", "firstName lastName")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error("Get user orders error:", error);
    res.status(500).json({ message: error.message });
  }
});

// НОВИЙ МАРШРУТ: Пошук замовлення за номером телефону
router.post("/track", async (req, res) => {
  try {
    const { phone } = req.body;

    console.log("=== TRACK ORDER REQUEST ===");
    console.log("Phone received:", phone);

    if (!phone || !phone.trim()) {
      console.log("ERROR: Phone is empty");
      return res.status(400).json({ message: "Phone number required" });
    }

    // Нормалізувати номер телефону
    const inputPhoneClean = phone.replace(/[\s\-()]/g, '');
    console.log("Normalized phone:", inputPhoneClean);

    // Отримати всі замовлення
    const allOrders = await Order.find({})
      .populate({
        path: "managerId",
        select: "firstName lastName",
        options: { strictPopulate: false }
      })
      .populate({
        path: "userId", 
        select: "firstName lastName email",
        options: { strictPopulate: false }
      })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`Total orders in DB: ${allOrders.length}`);

    // Фільтрувати замовлення за телефоном
    const orders = allOrders.filter(order => {
      if (!order.customerPhone) return false;
      
      const dbPhoneClean = order.customerPhone.replace(/[\s\-()]/g, '');
      
      const matches = dbPhoneClean === inputPhoneClean || 
                      dbPhoneClean.includes(inputPhoneClean) ||
                      inputPhoneClean.includes(dbPhoneClean);
      
      if (matches) {
        console.log(`Match found: ${order._id} - ${order.customerPhone}`);
      }
      
      return matches;
    });

    const limitedOrders = orders.slice(0, 20);

    console.log(`Found ${limitedOrders.length} matching orders`);
    console.log("=== END TRACK REQUEST ===");

    res.json(limitedOrders);
  } catch (error) {
    console.error("=== TRACK ORDER ERROR ===");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    res.status(500).json({ 
      message: "Помилка пошуку замовлень",
      error: error.message 
    });
  }
});

module.exports = router;
