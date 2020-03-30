const express = require("express");
const router = express.Router();

const Fawn = require("fawn");
const mongoose = require("mongoose");
Fawn.init(mongoose);

const { Product } = require("../models/product");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const { Rental } = require("../models/rental");
const validateRental = require("../middleware/validateRental");

//gets either requested rentals or all rentals
router.get("/", auth, admin, async (req, res) => {
  if (req.query.requested === "true") {
    const rentals = await Rental.find({
      dateOut: { $exists: false },
      dateReturned: { $exists: false }
    });
    return res.send(rentals);
  }

  const rentals = await Rental.find();
  res.send(rentals);
});

//Get either processed or unprocessed returns depending on req.query.
router.get("/returns/", auth, admin, async (req, res) => {
  const processed = req.query.processed;

  if (processed) {
    const rentals = await Rental.find({ confirmedReturned: true });
    return res.send(rentals);
  }

  const rentals = await Rental.find({
    dateReturned: { $exists: true },
    confirmedReturned: false
  });
  return res.send(rentals);
});

//Request a new rental
router.post("/", auth, validateRental, async (req, res) => {
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

//Admin confirms rental with given ID and supplied instructions
router.patch("/:id", auth, admin, async (req, res) => {
  const rental = await Rental.findById(req.params.id);

  rental.confirmRental(
    req.body.pickUpInstructions,
    req.body.returnInstructions
  );

  //email user of confirmation services.sendNotificationEmail(req.user.)

  await rental.save();
  res.send(rental);
});

//Requests a return
router.post("/returns/:id", auth, validateObjectId, async (req, res) => {
  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).send("Rental not found");

  if (rental.user._id.toString() !== req.user._id)
    return res
      .status(400)
      .send("User registered on rental is not the same as logged in user");

  rental.markAsReturned(req.body.remarks);

  await rental.save();

  res.send(rental);
});

//Admin confirms a return
router.patch("/returns/:id", auth, admin, async (req, res) => {
  if (req.body.setAvailable === undefined) {
    res.status(400).send("Request body missing setAvailable");
  }

  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).send("Rental not found");

  if (req.body.setAvailable) {
    const product = await Product.findById(rental.product._id);
    const entity = product.entities.find(entity => {
      return entity._id.toString() === rental.product.entity._id.toString();
    });

    entity.availableForRental = true;

    const task = Fawn.Task();
    task.update("rentals", { _id: rental._id }, { confirmedReturned: true });
    task.update(
      "products",
      { _id: product._id },
      { entities: product.entities }
    );

    try {
      await task.run();
      return res.send("Return successful");
    } catch (error) {
      res.status(500).send("Something failed");
    }
  } else {
    rental.confirmReturn();
    await rental.save();
    res.send("Return successful");
  }
});

module.exports = router;
