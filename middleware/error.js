module.exports = function(err, req, res, next) {
  //Consider using winston to log error object
  res.status(500).send("Something failed");
};
