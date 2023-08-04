const { Schema, model } = require("mongoose");

const FortuneSchema = new Schema({
  level: { type: Number, required: true },
  slots: { type: Array },
  sectors: { type: Number },
  bet: { type: Number },
});

module.exports = model("Fortune", FortuneSchema);
