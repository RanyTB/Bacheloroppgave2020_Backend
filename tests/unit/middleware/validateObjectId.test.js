const validateObjectId = require("../../../middleware/validateObjectId");

const mongoose = require("mongoose");
var MockExpressResponse = require("mock-express-response");
let next;

describe("validateObjectId middleware", () => {
  beforeEach(() => {
    next = jest.fn();
  });

  it("should call next() if ObjectID is valid", () => {
    const validObjectId = mongoose.Types.ObjectId().toHexString();

    const req = {
      params: {
        id: validObjectId
      }
    };

    const res = {};

    validateObjectId(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it("should return 400 if ObjectId is invalid", () => {
    const invalidObjectId = "WIOAJRIOJWA";

    const req = {
      params: {
        id: invalidObjectId
      }
    };

    var res = new MockExpressResponse();
    res.status = jest.fn(() => {
      return {
        send: jest.fn()
      };
    });

    validateObjectId(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});
