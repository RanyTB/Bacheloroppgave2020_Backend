const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");
const config = require("config");
const sendEmail = require("../services/sendEmail");

router.post("/", async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  let user = await User.findOne({ email: req.body.email.toLowerCase() });
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

router.post("/resetpassword", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).send("Missing email in body!");

  const user = await User.findOne({ email: email.toLowerCase() });

  if (user) {
    const token = user.generatePasswordResetToken();
    const resetLink = `"${config.get(
      "frontendBaseURL"
    )}/resetpassword/${token}"`;

    sendEmail(
      user,
      "Reset your password here",
      `<h1>Reset your password</h1>
    <p>To reset your password, please click the link below:</p>
    <a href=${resetLink}>Reset password</a>`
    );
  }

  res.send(
    "An email with password reset instructions have been sent if email exists."
  );
});

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().required().email().min(14).max(255),
    password: Joi.string().min(8).max(255).required(),
  });
  return schema.validate(req);
}

module.exports = router;
