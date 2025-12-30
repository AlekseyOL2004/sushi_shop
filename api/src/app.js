const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRouter = require("./routers/user");
const menuRouter = require("./routers/menu");
const orderRouter = require("./routers/order");
const reviewRouter = require("./routers/review");
const categoryRouter = require("./routers/category");
const statisticsRouter = require("./routers/statistics");
const { port, host, mongoURL } = require("./configuration/index");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Логування запитів
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/users", userRouter);
app.use("/menu", menuRouter);
app.use("/orders", orderRouter);
app.use("/reviews", reviewRouter);
app.use("/categories", categoryRouter);
app.use("/statistics", statisticsRouter);

// 404 handler
app.use((req, res) => {
  console.log(`404 - Route not found: ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("❌ Global error handler:", err);
  console.error("Stack:", err.stack);
  res.status(500).json({
    message: "Internal server error",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

const startServer = () => {
  app.listen(port, host, () => {
    console.log(`✅ Server is running on http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
  });
};

if (require.main === module) {
  mongoose
    .connect(mongoURL)
    .then(() => {
      console.log("✅ Connected to MongoDB");
      startServer();
    })
    .catch((error) => {
      console.error("❌ MongoDB connection error:", error.message);
      process.exit(1);
    });
}

module.exports = { app, startServer };
