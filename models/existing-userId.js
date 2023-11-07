const { Schema, model } = require("mongoose");

const ExisitngUsersSchema = new Schema({
  userID: { type: String, unique: true, required: true },
});

module.exports = model("ExisitngUsers", ExisitngUsersSchema);
