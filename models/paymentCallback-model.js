const { Schema, model } = require("mongoose");

const PaymentSchema = new Schema({
  paymentData: {
    type: JSON,
  },
  //   data: { type: JSON, required: true },
  //   signature: { type: String, required: true },
});

module.exports = model("Payment", PaymentSchema);
