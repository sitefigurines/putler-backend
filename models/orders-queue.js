const { Schema, model } = require("mongoose");

const OrderQueueSchema = new Schema({
  userId: { type: String, required: true },
  orderId: { type: String, unique: true, required: true },
  orderInformation: { type: JSON, required: true },
});

module.exports = model("OrderQueue", OrderQueueSchema);
