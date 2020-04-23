const mongoose = require("mongoose");
const Joi = require("@hapi/joi");

const suggestionSchema = new mongoose.Schema({
  suggestion: {
    type: String,
    minlength: 1,
    maxlength: 200,
    required: true,
  },
  name: {
    type: String,
    minlength: 1,
    maxlength: 510,
    required: true,
  },
});

function validateSuggestion(suggestion) {
  const schema = Joi.object({
    suggestion: Joi.string().required().min(1).max(200),
    name: Joi.string().required().min(1).max(510),
  });

  return schema.validate(suggestion);
}

const Suggestion = mongoose.model("suggestion", suggestionSchema);

module.exports.validateSuggestion = validateSuggestion;
module.exports.Suggestion = Suggestion;
