module.exports = function(err, req, res, next) {
  //Consider using winston to log error object
  if (err) console.log("something failed +\n" + err);
  res.status(500).send("Something failed");
};
