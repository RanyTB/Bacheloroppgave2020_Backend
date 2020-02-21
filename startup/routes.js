const express = require("express");

const home = require("../routes/home");

module.exports = function(app) {
  app.use(express.json());

  //Mount routes middleware
  app.use("/api", home);
};
