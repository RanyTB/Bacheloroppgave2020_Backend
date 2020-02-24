const express = require("express");
const router = express.Router();

const { Product } = require("../models/product");

router.get("/", async (req, res) => {
  const result = await Product.find();
  res.send(result);
});

module.exports = router;
