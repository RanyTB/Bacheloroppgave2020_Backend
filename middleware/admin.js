const config = require("config");

module.exports = function(req, res, next) {
  const requiresAuth = config.get("requiresAuth");
  if (!requiresAuth) return next();

  if (!req.user.isAdmin) return res.status(403).send("Access denied.");

  next();
};
