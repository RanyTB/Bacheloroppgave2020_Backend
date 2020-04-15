const mongoose = require("mongoose");

module.exports = (req, res, next) => {
  if (mongoose.isValidObjectId(req.params.id)) {
    return next();
  }
  res.status(400).send("Invalid ID");
};
