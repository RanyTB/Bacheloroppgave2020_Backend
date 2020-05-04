const mongoose = require("mongoose");
const { Schema } = mongoose;
const Joi = require("@hapi/joi");
Joi.objectId = require("joi-objectid")(Joi);

function validateRental(rental) {
  const schema = Joi.object({
    productId: Joi.objectId().required(),
    userId: Joi.objectId().required(),
  });
  return schema.validate(rental);
}

const rentalSchema = new Schema({
  user: {
    type: new Schema({
      name: {
        type: String,
        minlength: 2,
        maxlength: 510,
        required: true,
      },
    }),
    required: true,
  },
  product: {
    type: new Schema({
      name: {
        type: String,
        required: true,
      },
      entity: {
        type: new Schema({
          identifier: {
            type: String,
            required: true,
          },
        }),
        required: true,
      },
    }),
    required: true,
  },
  dateOut: {
    type: Date,
  },
  dateReturned: {
    type: Date,
  },
  confirmedReturned: {
    type: Boolean,
    required: true,
    default: false,
  },
  pickUpInstructions: {
    type: String,
  },
  returnInstructions: {
    type: String,
  },
  remarks: {
    type: String,
  },
  dateToReturn: {
    type: Date,
  },
});

rentalSchema.methods.confirmRental = function (
  pickUpInstructions,
  returnInstructions,
  dateToReturn
) {
  this.dateOut = Date.now();
  this.dateToReturn = dateToReturn;

  this.pickUpInstructions = pickUpInstructions;
  this.returnInstructions = returnInstructions;
};

rentalSchema.methods.markAsReturned = function (remarks) {
  this.dateReturned = Date.now();

  if (remarks) {
    this.remarks = remarks;
  }
};

rentalSchema.methods.confirmReturn = function () {
  this.confirmedReturned = true;
  if (!this.dateReturned) this.dateReturned = new Date();
};

const Rental = mongoose.model("rental", rentalSchema);

module.exports.validateRental = validateRental;
module.exports.Rental = Rental;
