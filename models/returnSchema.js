const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema({
  returnUser: {
    type: String,
    required: true,
  },
  returnReason: {
    type: String,
    required: true,
  },
  returnMessage: {
    type: String,
    required: true,
  },
  orderId: {
    type: String,
    required: true,
  },
  itemId: {
    type: String,
    required: true,
  },
  reviewSubmitted: {
    type: Boolean,
  },
  productPictures: {
    type: String,
  },
  returnStatus: {
    type: String,
    default: "Pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const Return = mongoose.model("Return", returnSchema);
module.exports = Return;
