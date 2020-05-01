const { validateServiceMessage } = require("../models/serviceMessage");

module.exports = (req, res, next) => {
  const { error } = validateServiceMessage(req.body);
  if (error)
    return res.status(400).send("Not a valid service message " + error.message);
  next();
};
