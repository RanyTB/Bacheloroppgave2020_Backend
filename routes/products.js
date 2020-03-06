const express = require("express");
const router = express.Router();
const validateObjectID = require("../middleware/validateObjectId");
const validateProduct = require("../middleware/validateProduct");

const { Product } = require("../models/product");
const { Category } = require("../models/category");

router.get("/", async (req, res) => {
  const products = await Product.find();
  res.send(products);
});

router.get("/:id", validateObjectID, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product)
    return res.status(404).send(`Product ${req.params.id} not found`);

  res.send(product);
});

router.post("/", validateProduct, async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.send(product);
});

router.delete("/:id", validateObjectID, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).send("Product was not found");

  res.send(product);
});

router.put("/:id", validateObjectID, validateProduct, async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found");

  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { runValidators: true, new: true }
  );

  res.send(updatedProduct);
});

module.exports = router;
