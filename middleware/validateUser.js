const { validateUser, User } = require("../models/user");

module.exports = async (req, res, next) => {
  const user = req.body;
  const { error } = validateUser(user);
  if (error) return res.status(400).send("Not a valid user " + error.message);

  next();
};
