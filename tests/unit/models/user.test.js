const { User } = require("../../../models/user");
const jwt = require("jsonwebtoken");
const config = require("config");
const mongoose = require("mongoose");

const exampleUser = {
  firstName: "firstName",
  lastName: "lastName",
  email: "exampleUser@address.com",
  password: "password",
  phone: "11111111",
};



describe("user.generateAuthToken", () => {

  it("should return a valid JWT for admin user", async() => {
    const admin = new User({...exampleUser, isAdmin: true});

    const payload = {
      _id: admin._id.toString(),
      name: admin.firstName + " " + admin.lastName,
      isAdmin: true
    };
    const token = admin.generateAuthToken();
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    expect(decoded).toMatchObject(payload);
  });

  it("should return a valid JWT for non admin user", () => {
    const nonAdmin = new User({...exampleUser});

    const payload = {
      _id: nonAdmin._id.toString(),
      name: nonAdmin.firstName + " " + nonAdmin.lastName,
      isAdmin: false
    };
    const token = nonAdmin.generateAuthToken();
    const decoded = jwt.verify(token, config.get("jwtPrivateKey"));
    expect(decoded).toMatchObject(payload);
  });
  })


