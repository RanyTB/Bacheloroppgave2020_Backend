const Joi = require("@hapi/joi");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const config = require("config");

function validateUser(user) {
  const schema = Joi.object({
    firstName: Joi.string()
      .required()
      .min(1)
      .max(255),
    lastName: Joi.string()
      .required()
      .min(3)
      .max(255),
    email: Joi.string()
      .required()
      .email()
      .min(14)
      .max(255),
    password: Joi.string()
      .min(8)
      .max(255)
      .required(),
    phone: Joi.string()
      .min(8)
      .max(16)
      .required(),
    isAdmin: Joi.bool()
  });
  return schema.validate(user);
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    minlength: 1,
    maxlength: 255,
    required: true
  },
  lastName: {
    type: String,
    minlength: 1,
    maxlength: 255,
    required: true
  },
  email: {
    type: String,
    minlength: 14,
    maxlength: 255,
    unique: true,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    minlength: 8,
    maxlength: 16,
    required: true
  },
  isAdmin: {
    type: Boolean,
    default: false,
    required: true
  },
  isActive: {
    type: Boolean,
    default: false,
    required: true
  }
});

userSchema.methods.generateAuthToken = function() {
  const token = jwt.sign(
    {
      _id: this._id,
      name: this.firstName + " " + this.lastName,
      isAdmin: this.isAdmin
    },
    config.get("jwtPrivateKey"),
    { expiresIn: "1d" }
  );

  return token;
};

userSchema.methods.generateEmailToken = async function() {
  const token = jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    config.get("jwtPrivateKey")
  );

  return token;
};

const User = mongoose.model("user", userSchema);

module.exports.validateUser = validateUser;
module.exports.User = User;
