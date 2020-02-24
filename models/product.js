const mongoose = require("mongoose");
Schema = mongoose.Schema;
const Joi = require("@hapi/joi");
Joi.objectId = require("joi-objectid")(Joi);

function validateProduct(product) {
  const schema = Joi.object({
    name: Joi.string()
      .min(3)
      .max(255)
      .required(),
    category: Joi.object({
      _id: Joi.objectId(),
      name: Joi.string()
    }).required(),
    entities: Joi.array()
      .items(
        Joi.object({
          identifier: Joi.string()
            .required()
            .min(1)
            .max(64),
          availableForRental: Joi.boolean().required(),
          remarks: Joi.string().required()
        })
      )
      .required(),
    numberOfLoans: Joi.number(),
    description: Joi.string().required(),
    details: Joi.array()
      .items(
        Joi.object({
          displayName: Joi.string().required(),
          value: Joi.string().required()
        })
      )
      .required()
  });

  return schema.validate(product);
}

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
    required: true
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
module.exports.validateProduct = validateProduct;
