const express = require("express");
const mongoose = require("mongoose");
const userRouter = require("./routers/user");
const menuRouter = require("./routers/menu");
const categoryRouter = require("./routers/category");
const orderRouter = require("./routers/order");
const reviewRouter = require("./routers/review");
const uploadRouter = require("./routers/upload");
const { PORT, HOST, MONGO_URL } = require("./configuration/configuration");

const app = express();

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// Serve uploaded files
app.use("/uploads", express.static("uploads"));

// Routes
app.use("/users", userRouter);
app.use("/menu", menuRouter);
app.use("/categories", categoryRouter);
app.use("/orders", orderRouter);
app.use("/reviews", reviewRouter);
app.use("/upload", uploadRouter);

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    mongodb: mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ message: err.message || "Internal server error" });
});

// MongoDB connection and server start
const startServer = async () => {
  try {
    console.log("🔧 Configuration loaded:");
    console.log("   PORT:", PORT);
    console.log("   HOST:", HOST);
    console.log("   MONGO_URL:", MONGO_URL.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@")); // Hide password

    console.log("🔄 Connecting to MongoDB...");
    
    await mongoose.connect(MONGO_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log("✅ MongoDB connected successfully");
    console.log("   Database:", mongoose.connection.name);

    app.listen(PORT, HOST, () => {
      console.log(`✅ API Server running on http://${HOST}:${PORT}`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error("❌ Failed to connect to MongoDB:");
    console.error("   Error:", error.message);
    console.error("   MONGO_URL:", MONGO_URL.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@"));
    
    if (error.name === 'MongoServerError') {
      console.error("   Auth failed. Check username/password");
    } else if (error.name === 'MongoNetworkError') {
      console.error("   Network error. Check MongoDB IP and port");
    }
    
    console.error("   Full error:", error);
    process.exit(1);
  }
};

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  console.error("MongoDB connection error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.warn("MongoDB disconnected");
});

mongoose.connection.on("reconnected", () => {
  console.log("MongoDB reconnected");
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\nShutting down gracefully...");
  await mongoose.connection.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});

// Викликати startServer тільки якщо файл запускається напряму
if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
