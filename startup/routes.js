const express = require("express");

const requestLogger = require("../middleware/requestLogger");
const docs = require("../routes/docs");
const products = require("../routes/products");
const users = require("../routes/users");
const error = require("../middleware/error");
const auth = require("../routes/auth");

module.exports = function(app) {
  app.use(express.json());
  app.use(requestLogger);

  //Mount routes middleware
  app.use("/api", docs);
  app.use("/api/docs", docs);
  app.use("/api/products", products);
  app.use("/api/users", users);
  app.use("/api/auth", auth);
  app.use(error);
};
