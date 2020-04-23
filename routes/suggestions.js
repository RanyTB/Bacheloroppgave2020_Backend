const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const validateSuggestion = require("../middleware/validateSuggestion");

const { Suggestion } = require("../models/suggestion");

router.post("/", auth, validateSuggestion, async (req, res) => {
  const suggestion = new Suggestion(req.body);
  await suggestion.save();
  res.send(suggestion);
});

router.get("/", auth, admin, async (req, res) => {
  const suggestions = await Suggestion.find();
  res.send(suggestions);
});

module.exports = router;
