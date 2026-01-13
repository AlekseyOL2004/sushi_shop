const mongoose = require("mongoose");

const menuItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      default: "🍱",
    },
    imageUrl: {
      type: String,
      default: null,
    },
    category: {
      type: String,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    collection: "menuitems", // Явно вказуємо назву колекції
  }
);

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

module.exports = MenuItem;
