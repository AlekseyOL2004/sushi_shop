const express = require("express");
const Order = require("../models/order");
const MenuItem = require("../models/menuItem");
const User = require("../models/user");
const { isAdminOrModerator } = require("../middleware/auth");
const router = new express.Router();

// Тимчасово закоментуємо middleware для тестування
// router.use(isAdminOrModerator);

// Загальна статистика
router.get("/overview", async (req, res) => {
  try {
    const [
      totalOrders,
      pendingOrders,
      confirmedOrders,
      deliveredOrders,
      totalRevenue,
      totalUsers,
    ] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({ status: "pending" }),
      Order.countDocuments({ status: "confirmed" }),
      Order.countDocuments({ status: "delivered" }),
      Order.aggregate([
        { $match: { status: { $in: ["confirmed", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      User.countDocuments(),
    ]);

    res.json({
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        confirmed: confirmedOrders,
        delivered: deliveredOrders,
      },
      revenue: totalRevenue[0]?.total || 0,
      users: totalUsers,
    });
  } catch (error) {
    console.error("Statistics overview error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Статистика по продуктах (найпопулярніші)
router.get("/products", async (req, res) => {
  try {
    const popularProducts = await Order.aggregate([
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          totalQuantity: { $sum: "$items.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$items.quantity", "$items.price"] },
          },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 },
    ]);

    res.json(popularProducts);
  } catch (error) {
    console.error("Statistics products error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Статистика по періоду (за датою)
router.get("/period", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    const orders = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate),
          },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          count: { $sum: 1 },
          revenue: { $sum: "$totalPrice" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(orders);
  } catch (error) {
    console.error("Statistics period error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Статистика по необхідних продуктах
router.get("/needed-products", async (req, res) => {
  try {
    const neededProducts = await Order.aggregate([
      { $match: { status: { $in: ["pending", "confirmed"] } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.name",
          pendingQuantity: { $sum: "$items.quantity" },
        },
      },
      { $sort: { pendingQuantity: -1 } },
    ]);

    res.json(neededProducts);
  } catch (error) {
    console.error("Statistics needed products error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
