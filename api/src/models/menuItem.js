const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, default: "sushi" },
  available: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
