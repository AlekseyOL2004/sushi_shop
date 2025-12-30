const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        itemId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Menu",
          required: true,
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
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
      type: String,
      enum: [
        "processing", // В обробці
        "confirmed", // Прийнято
        "preparing", // Готується
        "ready", // Готово (самовивіз)
        "delivering", // Доставляється
        "completed", // Виконано (доставлено)
        "cancelled", // Скасовано
      ],
      default: "processing",
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

// Додати запис в історію при зміні статусу
orderSchema.pre("save", function (next) {
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
