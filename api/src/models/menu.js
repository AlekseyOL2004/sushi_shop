const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Name is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    min: [0, "Price must be positive"],
  },
  image: {
    type: String,
    default: "🍣",
  },
  category: {
    type: String,
    enum: ["rolls", "sushi", "sets", "soups", "drinks", "desserts"],
    default: "rolls",
    required: true,
  },
  ingredients: {
    type: String,
  },
  weight: {
    type: Number,
  },
  weightUnit: {
    type: String,
    enum: ["g", "l", "pcs"],
    default: "g",
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
  createdBy: {
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

menuSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Menu = mongoose.model("Menu", menuSchema);

module.exports = Menu;

// Переконайтеся що MongoDB автоматично додає _id при збереженні
