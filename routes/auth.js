const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid password");

  const token = user.generateAuthToken();

  res.send(token);
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string()
      .required()
      .email()
      .min(14)
      .max(255),
    password: Joi.string()
      .min(8)
      .max(255)
      .required()
  });
  return schema.validate(req);
}

module.exports = router;
