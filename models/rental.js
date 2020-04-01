const mongoose = require("mongoose");
const { Schema } = mongoose;
const Joi = require("@hapi/joi");
Joi.objectId = require("joi-objectid")(Joi);

function validateRental(rental) {
  const schema = Joi.object({
    productId: Joi.objectId().required(),
    userId: Joi.objectId().required()
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
        required: true
      }
    }),
    required: true
  },
  product: {
    type: new Schema({
      name: {
        type: String,
        required: true
      },
      entity: {
        type: new Schema({
          identifier: {
            type: String,
            required: true
          }
        }),
        required: true
      }
    }),
    required: true
  },
  dateOut: {
    type: Date
  },
  dateReturned: {
    type: Date
  },
  confirmedReturned: {
    type: Boolean,
    required: true,
    default: false
  },
  pickUpInstructions: {
    type: String
  },
  returnInstructions: {
    type: String
  },
  remarks: {
    type: String
  }
});

rentalSchema.methods.confirmRental = function(
  pickupInstructions,
  returnInstructions
) {
  this.dateOut = Date.now();

  this.pickupInstructions = pickupInstructions;
  this.returnInstructions = returnInstructions;

  //Set product.availableForRental to false here.
};

rentalSchema.methods.markAsReturned = function(remarks) {
  this.dateReturned = Date.now();

  if (remarks) {
    this.remarks = remarks;
  }
};

rentalSchema.methods.confirmReturn = function() {
  this.confirmedReturned = true;
};

const Rental = mongoose.model("rental", rentalSchema);

module.exports.validateRental = validateRental;
module.exports.Rental = Rental;
