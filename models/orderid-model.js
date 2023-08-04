const { Schema, model } = require("mongoose");

const OrderIdSchema = new Schema({
  orderId: { type: String, unique: true, required: true },
});

module.exports = model("OrderId", OrderIdSchema);
