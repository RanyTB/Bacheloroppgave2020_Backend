const express = require("express");
const router = express.Router();
const { Category } = require("../models/category");
const validateObjectId = require("../middleware/validateObjectId");

const validateCategory = require("../middleware/validateCategory");

router.get("/", async (req, res) => {
  const categories = await Category.find();
  res.send(categories);
});

router.get("/:id", validateObjectId, async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) return res.status(404).send("Category not found");

  res.send(category);
});

router.post("/", validateCategory, async (req, res) => {
  const category = req.body;
  if (req.parentInDB) category.parent.name = req.parentInDB.name;

  const newCategory = new Category(category);
  await newCategory.save();
  res.send(newCategory);
});

router.put("/:id", validateObjectId, validateCategory, async (req, res) => {
  const category = req.body;
  if (req.parentInDB) category.parent.name = req.parentInDB.name;

  const updatedCategory = await Category.findByIdAndUpdate(
    req.params.id,
    {
      name: category.name,
      parent: category.parent
    },
    { runValidators: true, new: true }
  );

  res.send(category);
});

router.delete("/:id", validateObjectId, async (req, res) => {
  const deleted = await Category.findByIdAndRemove(req.params.id);
  if (!deleted) return res.status(404).send("Existing category not found");

  res.send(deleted);
});

module.exports = router;
