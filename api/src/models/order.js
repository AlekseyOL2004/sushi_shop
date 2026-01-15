const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: false, // ВИПРАВЛЕННЯ: Змінено на false для бонусних ролів
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
      },
    ],
    totalPrice: { type: Number, required: true, min: 0 },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerAddress: { type: String, required: true },
    deliveryType: {
      type: String,
      enum: ["delivery", "pickup"],
      default: "delivery",
    },
    sticksType: {
      type: String,
      enum: ["learning", "regular"],
      default: "regular",
    },
    cutleryCount: { type: Number, default: 1, min: 0 },
    comment: { type: String, default: "" },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    bonusPointsEarned: {
      type: Number,
      default: 0,
    },
    bonusRollsUsed: {
      type: Number,
      default: 0,
    },
    birthdayRollUsed: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "processing",
        "confirmed",
        "preparing",
        "ready",
        "delivering",
        "completed",
        "cancelled",
      ],
      default: "pending",
    },
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    statusHistory: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

orderSchema.pre("save", function (next) {
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
