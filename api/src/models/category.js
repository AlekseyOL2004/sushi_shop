const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema({
  key: {
    type: String,
    required: [true, "Category key is required"],
    unique: true,
    lowercase: true,
  },
  label: {
    type: String,
    required: [true, "Label is required"],
  },
  icon: {
    type: String,
    required: [true, "Icon is required"],
  },
  color: {
    type: String,
    required: [true, "Color is required"],
  },
  isActive: {
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

categorySchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
