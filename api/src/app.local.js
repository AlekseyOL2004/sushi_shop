const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

try {
  const dotenvPath = process.env.DOTENV_PATH || "./.env.local";
  require("dotenv").config({ path: dotenvPath });
  if (process.env.DOTENV_PATH)
    console.log("Loaded env from", process.env.DOTENV_PATH);
} catch (e) {
  console.log("No dotenv file found, using defaults");
}

const { mongoURL } = require("./configuration/index");

async function start() {
  try {
    let uri = process.env.MONGO_URL || mongoURL;

    if (!process.env.MONGO_URL) {
      console.log(
        "No MONGO_URL provided — starting in-memory MongoDB for local development..."
      );
      const mongod = await MongoMemoryServer.create();
      uri = mongod.getUri();
      console.log("In-memory MongoDB started. Connection URI: %s", uri);
      process._localMongod = mongod;
    }

    await mongoose.connect(uri);
    console.log(" Connected to MongoDB");

    const appModule = require("./app");
    if (typeof appModule.startServer === "function") {
      appModule.startServer();
    }
  } catch (err) {
    console.error(" Failed to start:", err.message || err);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

// Handle unhandled rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error(" Unhandled Rejection at:", promise, "reason:", reason);
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error(" Uncaught Exception:", error);
  process.exit(1);
});

start();
