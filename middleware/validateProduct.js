const { Category } = require("../models/category");
const { validateProduct } = require("../models/product");

module.exports = async (req, res, next) => {
  const { error } = validateProduct(req.body);
  if (error) return res.status(400).send(error.message);

  const category = await Category.findById(req.body.category._id);
  if (!category) return res.status(404).send("Category id was not found");
  req.body.category.name = category.name;

  next();
};
