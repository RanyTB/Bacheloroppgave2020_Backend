const express = require("express");

const requestLogger = require("../middleware/requestLogger");
const docs = require("../routes/docs");
const products = require("../routes/products");
const categories = require("../routes/categories");
const error = require("../middleware/error");

module.exports = function(app) {
  app.use(express.json());
  app.use(requestLogger);

  //Mount routes middleware
  app.use("/api", docs);
  app.use("/api/docs", docs);
  app.use("/api/products", products);
  app.use("/api/categories", categories);
  
  app.use(error);
};
