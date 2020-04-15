module.exports = function requestLogger(req, res, next) {
  if (process.env.NODE_ENV === "test") return next();
  console.log(`Request: ${req.originalUrl}`, JSON.stringify(req.body));
  next();
};
