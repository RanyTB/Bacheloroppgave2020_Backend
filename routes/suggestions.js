const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateSuggestion = require("../middleware/validateSuggestion");
const validateObjectID = require("../middleware/validateObjectId");

const { Suggestion } = require("../models/suggestion");

router.post("/", auth, validateSuggestion, async (req, res) => {
  const suggestion = new Suggestion({
    suggestion: req.body.suggestion,
    user: {
      _id: req.user._id,
      name: req.user.name,
    },
  });
  await suggestion.save();
  res.send(suggestion);
});

router.get("/", auth, admin, async (req, res) => {
  const suggestions = await Suggestion.find();
  res.send(suggestions);
});

router.delete("/:id", auth, admin, validateObjectID, async (req, res) => {
  const suggestion = await Suggestion.findByIdAndDelete(req.params.id);
  if (!suggestion)
    return res.status(404).send("Cannot find suggestion with given ID");
  res.send(suggestion);
});

module.exports = router;
