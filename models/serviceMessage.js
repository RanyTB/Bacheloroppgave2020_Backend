const mongoose = require("mongoose");
const Joi = require("@hapi/joi");

function validateServiceMessage(serviceMessage) {
  const schema = Joi.object({
    serviceMessage: Joi.string().required().min(1).max(4000),
  });

  return schema.validate(serviceMessage);
}

const serviceMessageSchema = new mongoose.Schema({
  serviceMessage: {
    type: String,
    minlength: 1,
    maxlength: 4000,
    required: true,
  },
});

const ServiceMessage = mongoose.model("service_message", serviceMessageSchema);

module.exports.ServiceMessage = ServiceMessage;
module.exports.validateServiceMessage = validateServiceMessage;
