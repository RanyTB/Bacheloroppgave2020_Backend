const express = require("express");
const router = express.Router();
const validateObjectID = require("../middleware/validateObjectId");
const validateUser = require("../middleware/validateUser");
const mongoose = require("mongoose");
const _ = require("lodash");
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");

router.get("/", auth, admin, async (req, res) => {
  const users = await User.find();
  res.send(users);
});

router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user._id).select("-password");
  res.send(user);
});

router.get("/:id", auth, admin, validateObjectID, async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send(`User ${req.params.id}`);

  res.send(user);
});

router.post("/", validateUser, async (req, res) => {
  let user = await User.findOne({ email: req.body.email });
  if (user) return res.status(400).send("User is already registered");

  user = new User(
    _.pick(req.body, ["firstName", "lastName", "email", "password", "phone"])
  );

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  return res.send(
    _.pick(user, ["_id", "firstName", "lastName", "email", "phone"])
  );
});

router.delete("/:id", auth, admin, validateObjectID, async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).send("Cannot find user with given ID");
  res.send(user);
});

router.put(
  "/:id",
  auth,
  admin,
  validateObjectID,
  validateUser,
  async (req, res) => {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      _.pick(req.body, [
        "firstName",
        "lastName",
        "email",
        "password",
        "phone",
        "isAdmin"
      ]),
      { new: true, useFindAndModify: false, runValidators: true }
    );

    if (!user) return res.status(404).send("User was not found");

    res.send(user);
  }
);

module.exports = router;
