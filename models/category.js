const mongoose = require("mongoose");
Schema = mongoose.Schema;
const Joi = require("@hapi/joi");
Joi.objectId = require("joi-objectid")(Joi);

function validateCategory(category) {
  const schema = Joi.object({
    name: Joi.string()
      .min(3)
      .required(),
    parent: Joi.object({
      _id: Joi.objectId().required()
    })
  });

  return schema.validate(category);
}

const categorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  parent: new Schema({
    name: {
      type: String,
      required: true
    }
  })
});

module.exports.Category = mongoose.model("category", categorySchema);
module.exports.validateCategory = validateCategory;
