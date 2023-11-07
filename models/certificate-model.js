const { Schema, model } = require("mongoose");

const CertificateSchema = new Schema({
  orderId: { type: String, unique: true, required: true },
  content: { type: Array },
  userOwner: { type: String },
  userId: { type: String, required: true },
});

module.exports = model("Certificate", CertificateSchema);
