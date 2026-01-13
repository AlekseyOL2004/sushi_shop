const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/api";

console.log("🔧 Configuration loaded:");
console.log("  PORT:", PORT);
console.log("  HOST:", HOST);
console.log("  MONGO_URL:", MONGO_URL);

module.exports = {
  PORT,
  HOST,
  MONGO_URL,
};
