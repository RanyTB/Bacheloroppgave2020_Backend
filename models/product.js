const mongoose = require("mongoose");
Schema = mongoose.Schema;

const productSchema = new Schema({
  name: {
    type: String,
    minlength: 3,
    maxlength: 255,
    required: true
  },
  category: new Schema({
    name: {
      type: String
    }
  }),
  entities: [
    {
      identifier: {
        type: String,
        required: true
      },
      availableForRental: {
        type: Boolean,
        required: true,
        default: true
      },
      remarks: String
    }
  ],
  numberOfLoans: {
    type: Number,
    default: 0
  },
  description: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 500
  },
  details: [
    {
      displayName: String,
      value: String
    }
  ]
});

const Product = mongoose.model("product", productSchema);

module.exports.Product = Product;
