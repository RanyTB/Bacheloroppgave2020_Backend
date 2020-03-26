const express = require("express");
const router = express.Router();

const Fawn = require("fawn");
const mongoose = require("mongoose");
Fawn.init(mongoose);

const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const { Rental } = require("../models/rental");

router.post("/", auth, async (req, res) => {
  const product = await Product.findById(req.body.productId);
  if (!product) return res.status(404).send("Product not found");

  const entity = product.entities.find(entity => {
    return entity.availableForRental;
  });

  if (!entity) return res.status(400).send("No available entities");

  const rental = new Rental({
    user: {
      _id: req.user._id,
      name: req.user.name
    },
    product: {
      _id: product._id,
      name: product.name,
      entity: {
        _id: entity._id,
        identifier: entity.identifier
      }
    }
  });

  entity.availableForRental = false;

  const task = Fawn.Task();
  task.save("rentals", rental);
  task.update("products", { _id: product._id }, { entities: product.entities });

  try {
    await task.run();
    res.send(rental);
  } catch (error) {
    res.status(500).send("Something failed");
  }
});

router.get("/", auth, async (req, res) => {
  //Get rentals specified with query params

  if (req.query.requestedRentals) {
    const rentals = await Rental.find({ dateOut: { $exists: false } });
    return res.send(rentals);
  }

  const rentals = await Rental.find();
  res.send(rentals);
});

router.patch("/:id", auth, async (req, res) => {
  //Confirm rental by setting dateOut and notifying user
  //OR mark rental as returned by setting dateReturned and OPTIONALLY setting remarks
  //OR confirm returned
});

module.exports = router;
