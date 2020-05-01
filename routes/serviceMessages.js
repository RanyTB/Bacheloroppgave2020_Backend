const express = require("express");
const router = express.Router();

const mongoose = require("mongoose");
const { ServiceMessage } = require("../models/serviceMessage");

const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateServiceMessage = require("../middleware/validateServiceMessage");
const validateObjectID = require("../middleware/validateObjectId");

router.get("/", auth, async (req, res) => {
  const serviceMessages = await ServiceMessage.find();
  res.send(serviceMessages);
});

router.post("/", auth, admin, validateServiceMessage, async (req, res) => {
  const serviceMessage = new ServiceMessage({
    serviceMessage: req.body.serviceMessage,
  });

  await serviceMessage.save();

  res.send(serviceMessage);
});

router.delete("/:id", auth, admin, validateObjectID, async (req, res) => {
  const serviceMessage = await ServiceMessage.findByIdAndDelete(req.params.id);

  if (!serviceMessage)
    return res
      .status(404)
      .send("Cannot find service message with the given ID");
  res.send(serviceMessage);
});

module.exports = router;
