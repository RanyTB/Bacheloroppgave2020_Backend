const express = require("express");

const docs = require("../routes/docs");
const products = require("../routes/products");

module.exports = function(app) {
  app.use(express.json());

  //Mount routes middleware
  app.use("/api", docs);
  app.use("/api/docs", docs);
  app.use("/api/products", products);
};
