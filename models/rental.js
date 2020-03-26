const mongoose = require("mongoose");
const { Schema } = mongoose;

//ADD JOI VALIDATION

//Add id requirement in validation function for user and product
//Checking that sub-doc id exist is not the responsibility of this module and will be placed in the corresponding route
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
  pickupInstructions: {
    type: String
  },
  returnInstructions: {
    type: String
  },
  remarks: {
    type: String
  }
});

rentalSchema.methods.confirmRental = function() {
  this.dateOut = Date.now();

  //Set product.availableForRental to false here.
};

rentalSchema.methods.return = function() {
  this.dateReturned = Date.now();

  //Set product.availableForRental to true here.
};

const Rental = mongoose.model("rental", rentalSchema);

module.exports.Rental = Rental;
