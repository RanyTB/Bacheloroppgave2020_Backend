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
  if (!user) return res.status(400).send("Invalid login details");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid login details");

  const token = user.generateAuthToken();

  if (!user.isActive)
    return res.status(403).send("User has not verified email address");

  res.send(token);
});

router.post("/token/:jwt", async (req, res) => {
  const token = req.params.jwt;

  try {
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));

    const user = await User.findById(decoded._id);
    user.isActive = true;
    await user.save();
    res.status(200).send("Successfully verified email");
  } catch (ex) {
    res.status(400).send("Invalid token");
  }
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
