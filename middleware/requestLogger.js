module.exports = function requestLogger(req, res, next) {
  console.log(`Request: ${req.originalUrl}`, JSON.stringify(req.body));
  next();
};
