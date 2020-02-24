module.exports = function logger(req, res, next) {
  console.log(`Request: ${req.originalUrl}`, JSON.stringify(req.body));
  next();
};
