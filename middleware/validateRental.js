const { validateRental } = require("../models/rental");

module.exports = (req, res, next) => {
  req.body.userId = req.user._id;
  const { error } = validateRental(req.body);
  if (error) return res.status(400).send("Not a valid rental " + error.message);
  next();
};
