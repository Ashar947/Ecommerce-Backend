const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  productName: {
    type: String,
    required: true,
  },
  productDescription: {
    type: String,
  },
  productCategory: {
    type: String,
    required: true,
  },
  productPrice: {
    type: Number,
    required: true,
  },
  productColor: {
    type: String,
    required: true,
  },
  feature: {
    type: Boolean,
    default: false,
  },
  productRating: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  productReview: [
    {
      reviewUserName: {
        type: String,
      },
      reviewStar: {
        type: Number,
      },
      reviewText: {
        type: String,
      },
      reviewPictures: [
        {
          path: {
            type: String,
          },
        },
      ],
    },
  ],
  productPicture: [
    {
      prodPic: {
        type: String,
      },
    },
  ],
});
const Product = mongoose.model("Product", productSchema);
module.exports = Product;
