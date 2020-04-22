const { validateCategory, Category } = require("../models/category");

module.exports = async (req, res, next) => {
  const category = req.body;

  const { error } = validateCategory(category);
  if (error) return res.status(400).send("Could not create category: " + error);

  if (req.method !== "PUT") {
    const existingCategories = await Category.find({
      name: category.name,
    });

    let hasDuplicate = false;

    existingCategories.forEach((existingCategory) => {
      if (!existingCategory.parent && !category.parent) hasDuplicate = true;

      if (
        existingCategory.parent &&
        category.parent &&
        existingCategory.parent._id.toString() ===
          category.parent._id.toString()
      )
        hasDuplicate = true;
    });

    if (hasDuplicate) {
      return res
        .status(400)
        .send(`Category with name ${category.name} already exists!`);
    }
  }

  if (category.parent) {
    const parentInDB = await Category.findById(category.parent._id);

    if (!parentInDB)
      return res.status(404).send("Parent was not found in database");

    if (parentInDB.parent) {
      return res
        .status(400)
        .send(
          `Parent ${parentInDB.name} has parent ${parentInDB.parent.name}. Only one level of subcategorization allowed!`
        );
    }

    req.parentInDB = parentInDB;
  }

  next();
};
