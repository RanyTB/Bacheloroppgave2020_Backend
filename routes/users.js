const express = require("express");
const router = express.Router();
const validateObjectID = require("../middleware/validateObjectId");
const validateUser = require("../middleware/validateUser");
const _ = require("lodash");
const { User } = require("../models/user");
const bcrypt = require("bcrypt");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const sendEmail = require("../services/sendEmail");
const { Rental } = require("../models/rental");
const config = require("config");

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

router.get("/:id/rentals", auth, async (req, res) => {
  if (!req.user.isAdmin && req.user._id !== req.params.id) {
    return res.status(401).send("Unauthorized");
  }

  if (req.query.requested === "true") {
    const rentals = await Rental.find({
      "user._id": req.params.id,
      dateOut: { $exists: false },
      dateReturned: { $exists: false }
    });
    return res.send(rentals);
  }

  const rentals = await Rental.find({ "user._id": req.params.id });
  res.send(rentals);
});
router.post("/", validateUser, async (req, res) => {
  let user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (user) return res.status(400).send("User is already registered");

  user = new User(
    _.pick(req.body, ["firstName", "lastName", "email", "password", "phone"])
  );
  user.email = user.email.toLowerCase();

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(user.password, salt);

  await user.save();

  const token = await user.generateEmailToken();

  sendEmail(
    user,
    "Please verify your email address",
    `Click the following link to verify your email address ${config.get(
      "frontendBaseURL"
    )}/verify-email/${token}`
  );

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
