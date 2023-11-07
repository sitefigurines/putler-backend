const { Schema, model } = require("mongoose");

const CandidateOrderSchema = new Schema({
  userId: { type: String, required: true },
  userOrder: { type: Object },
});

module.exports = model("CandidateOrder", CandidateOrderSchema);
