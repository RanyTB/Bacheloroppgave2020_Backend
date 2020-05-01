const { validateSuggestion } = require("../models/suggestion");

module.exports = (req, res, next) => {
  req.body.name = req.user.name;
  const { error } = validateSuggestion(req.body);
  if (error)
    return res.status(400).send("Not a valid suggestion " + error.message);
  next();
};
