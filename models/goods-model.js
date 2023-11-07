const { Schema, model } = require("mongoose");

const GoodsSchema = new Schema({
  articulus: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  nameEng: { type: String, required: true },
  img: { type: String },
  priceUAH: { type: Number, required: true },
  priceTP: { type: Number, required: true },
  priceUSD: { type: Number, required: true },
  description: { type: String },
  descriptionEng: { type: String },
  descriptionShort: { type: String },
  descriptionShortEng: { type: String },
  amount: { type: Number, required: true },
});

module.exports = model("Goods", GoodsSchema);
