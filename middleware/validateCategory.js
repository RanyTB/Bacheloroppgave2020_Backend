const { validateCategory, Category } = require("../models/category");

module.exports = async (req, res, next) => {
  const category = req.body;

  const { error } = validateCategory(category);
  if (error) return res.status(400).send("Could not create category: " + error);

  if (req.method !== "PUT") {
    const existingCategory = await Category.findOne({ name: category.name });
    if (existingCategory)
      return res
        .status(400)
        .send(`Category with name ${category.name} already exists!`);
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
