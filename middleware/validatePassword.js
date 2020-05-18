const { validatePassword } = require("../models/user");

module.exports = async (req, res, next) => {
  const user = req.body;
  const { error } = validatePassword(user);
  if (error)
    return res.status(400).send("Not a valid password. " + error.message);

  next();
};
