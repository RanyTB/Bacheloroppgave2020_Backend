const express = require("express");
const router = express.Router();
const validateObjectID = require("../middleware/validateObjectId");
const { Product, validateProduct } = require("../models/product");

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

router.post("/", async (req, res) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).send(error.message);

  const newProduct = new Product(req.body);

  try {
    await newProduct.save();
    res.send(newProduct);
  } catch (error) {
    res.status(400).send("Could not register product: " + error.message);
  }
});

router.delete("/:id", validateObjectID, async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) return res.status(404).send("Product was not found");

  res.send(product);
});

router.put("/:id", validateObjectID, async (req, res) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).send("Invalid product: " + error.message);

  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).send("Product not found");

  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { runValidators: true, new: true }
    );

    res.send(updatedProduct);
  } catch (error) {
    res.status(400).send("Could not update product: ", error.message);
  }
});

module.exports = router;
