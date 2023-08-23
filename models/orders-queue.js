const { Schema, model } = require("mongoose");

const OrderQueueSchema = new Schema({
  userId: { type: String, required: true },
  orderId: { type: String, unique: true, required: true },
  orderType: { type: String, required: true },
  orderInformation: { type: JSON },
  createdAt: { type: Number },
});

module.exports = model("OrderQueue", OrderQueueSchema);
