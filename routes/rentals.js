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
const validateObjectId = require("../middleware/validateObjectId");
const sendEmail = require("../services/sendEmail");
const { User } = require("../models/user");
const schedule = require("node-schedule");

//gets either requested rentals or all rentals
router.get("/", auth, admin, async (req, res) => {
  if (req.query.requested === "true") {
    const rentals = await Rental.find({
      dateOut: { $exists: false },
      dateReturned: { $exists: false },
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
    confirmedReturned: false,
  });
  return res.send(rentals);
});

//Request a new rental
router.post("/", auth, validateRental, async (req, res) => {
  const product = await Product.findById(req.body.productId);
  if (!product) return res.status(404).send("Product not found");

  const entity = product.entities.find((entity) => {
    return entity.availableForRental;
  });

  if (!entity) return res.status(400).send("No available entities");

  const rental = new Rental({
    user: {
      _id: req.user._id,
      name: req.user.name,
    },
    product: {
      _id: product._id,
      name: product.name,
      entity: {
        _id: entity._id,
        identifier: entity.identifier,
      },
    },
  });

  entity.availableForRental = false;
  product.numberOfLoans++;

  const task = Fawn.Task();
  task.save("rentals", rental);
  task.update(
    "products",
    { _id: product._id },
    { entities: product.entities, $inc: { numberOfLoans: 1 } }
  );

  await task.run();
  res.send(rental);
});

//Admin confirms rental with given ID and supplied instructions
router.patch("/:id", auth, admin, validateObjectId, async (req, res) => {
  if (!req.body.pickUpInstructions || !req.body.returnInstructions) {
    return res
      .status(400)
      .send("Missing pickUpInstructions or returnInstructions in request body");
  }

  const rental = await Rental.findById(req.params.id);
  if (!rental) return res.status(404).send("Rental not found");

  let dateToReturn = new Date();
  dateToReturn.setDate(dateToReturn.getDate() + 7);

  rental.confirmRental(
    req.body.pickUpInstructions,
    req.body.returnInstructions,
    dateToReturn
  );

  const user = await User.findById(rental.user._id);
  if (!user) {
    return res
      .status(500)
      .send(
        "UserID in rental does not exist or database is down! Mail not sent."
      );
  }

  sendEmail(
    user,
    "Your rental has been approved",
    `Hello ${user.firstName},<br><br>Your rental request for ${rental.product.name} has been approved.
    <br><br>Pick up instructions: ${rental.pickUpInstructions}<br>return instructions: ${rental.returnInstructions}`
  );

  let notifyDate = new Date();
  notifyDate.setDate(dateToReturn.getDate() - 1);

  date.setMinutes(notifyDate);
  var j = schedule.scheduleJob(date, () => {
    if (!rental.confirmedReturned) {
      sendEmail(
        user,
        `You have one day left to return the ${rental.product.name} you borrowed`,
        `Please return it according to the return instructions: ${rental.returnInstructions}`
      );
    }
  });

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
router.patch(
  "/returns/:id",
  auth,
  admin,
  validateObjectId,
  async (req, res) => {
    if (req.body.setAvailable === undefined)
      return res.status(400).send("Request body missing setAvailable");

    const rental = await Rental.findById(req.params.id);
    if (!rental) return res.status(404).send("Rental not found");

    if (req.body.setAvailable) {
      const product = await Product.findById(rental.product._id);

      const entity = product.entities.find((entity) => {
        return entity._id.toString() === rental.product.entity._id.toString();
      });

      entity.availableForRental = true;

      const rentalUpdateObject = { confirmedReturned: true };
      if (!rental.dateReturned) rentalUpdateObject.dateReturned = new Date();

      const task = Fawn.Task();
      task.update("rentals", { _id: rental._id }, rentalUpdateObject);
      task.update(
        "products",
        { _id: product._id },
        { entities: product.entities }
      );

      await task.run();
      return res.send("Return successful");
    } else {
      rental.confirmReturn();
      await rental.save();
      res.send("Return successful");
    }
  }
);

router.delete("/:id", auth, admin, validateObjectId, async (req, res) => {
  const rental = await Rental.findByIdAndDelete(req.params.id);
  if (!rental) return res.status(404).send("Cannot find rental with given ID");

  if (!req.body.notifyUser) {
    return res.send(rental);
  }
  const user = await User.findById(rental.user._id);
  if (!user) {
    return res
      .status(500)
      .send(
        "UserID in rental does not exist or database is down! Mail not sent."
      );
  }

  sendEmail(
    user,
    "Your rental has been rejected",
    `Hello ${user.firstName},<br><br>Your rental request for ${
      rental.product.name
    } has been rejected.
    <br><br>${req.body.deleteReason ? `Reason: ${req.body.deleteReason}` : ""}`
  );

  return res.send(rental);
});

module.exports = router;
