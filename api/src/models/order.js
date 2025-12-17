const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemId: { type: Number, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, default: 1 },
});

const orderSchema = new mongoose.Schema({
  items: [orderItemSchema],
  totalPrice: { type: Number, required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  customerAddress: { type: String, required: true },
  status: {
    type: String,
    enum: ["pending", "confirmed", "delivered", "cancelled"],
    default: "pending",
  },
  createdAt: { type: Date, default: Date.now },
});

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
