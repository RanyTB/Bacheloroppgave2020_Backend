const request = require("supertest");
const mongoose = require("mongoose");
const { User } = require("../../../models/user");
const app = require("../../../index");
const express = require("express");
const { Rental } = require("../../../models/rental");
const { Product } = require("../../../models/product");

app.use(express.json());

let exampleUserId;

let exampleAdmin = {
  firstName: "adminFirstName",
  lastName: "adminLastName",
  email: "administrator@address.com",
  password: "adminPassword",
  phone: "22222222"
};

let exampleUser = {
  firstName: "firstName",
  lastName: "lastName",
  email: "exampleUser@address.com",
  password: "password",
  phone: "11111111"
};

addExampleUser = async () => {
  let user = new User({
    ...exampleUser
  });
  exampleUserId = user.id;

  await user.save();
};

describe("/api/users", () => {
  let validAdminJWTToken;
  let validAuthNonAdminUserJWTToken;
  let admin;

  beforeEach(async () => {
    admin = new User({
      ...exampleAdmin,
      isAdmin: true
    });

    validAdminJWTToken = admin.generateAuthToken();

    validAuthNonAdminUserJWTToken = new User({
      ...exampleUser
    }).generateAuthToken();
  });
  afterEach(async () => {
    await User.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all users when requested by an authenticated admin", async () => {
      await User.collection.insertMany([
        {
          firstName: "firstName1",
          lastName: "lastName1",
          email: "email@address1.com",
          password: "password1",
          phone: "11111111"
        },
        {
          firstName: "firstName2",
          lastName: "lastName2",
          email: "email@address2.com",
          password: "password2",
          phone: "11111111"
        }
      ]);

      const res = await request(app)
        .get("/api/users")
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(g => g.email === "email@address1.com")).toBeTruthy();
      expect(res.body.some(g => g.email === "email@address2.com")).toBeTruthy();
    });

    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      const res = await request(app)
        .get("/api/users")
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      const res = await request(app)
        .get("/api/users")
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      const res = await request(app)
        .get("/api/users")
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /me", () => {
    let currentUserValidJWTToken;
    let currentUser;

    beforeEach(async () => {
      currentUser = new User({
        ...exampleUser
      });

      currentUserValidJWTToken = currentUser.generateAuthToken();

      await currentUser.save();
    });

    it("should return the currently authenticated user", async () => {
      const res = await request(app)
        .get("/api/users/me")
        .set("x-auth-token", currentUserValidJWTToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("firstName");
      expect(res.body).toHaveProperty("lastName");
      expect(res.body).toHaveProperty("email");
      expect(res.body).not.toHaveProperty("password");
      expect(res.body).toHaveProperty("phone");
    });

    it("should return 401 if no JWT token is provided", async () => {
      currentUserValidJWTToken = "";
      const res = await request(app)
        .get(`/api/users/me`)
        .set("x-auth-token", currentUserValidJWTToken);
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      currentUserValidJWTToken = "invalid";
      const res = await request(app)
        .get(`/api/users/me`)
        .set("x-auth-token", currentUserValidJWTToken);
      expect(res.status).toBe(400);
    });
  });

  describe("GET /:id", () => {
    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      const res = await request(app)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      const res = await request(app)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      const res = await request(app)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(403);
    });

    it("should return a user when a valid ID is passed", async () => {
      await addExampleUser();

      const res = await request(app)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(200);
      expect(res.body.email === exampleUser.email).toBeTruthy();
    });

    it("should return 400 if user ID is invalid", async () => {
      const res = await request(app)
        .get("/api/users/invalidID")
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if user does not exist", async () => {
      const validID = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/users/${validID}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /:id/rentals", () => {
    it("should return 401 if the user that request another users rentals is not admin", async () => {
      const nonAdmin = new User({ exampleUser });
      const admin = new User({ exampleAdmin });
      const nonAdminJWT = nonAdmin.generateAuthToken();

      const res = await request(app)
        .get(`/api/users/${admin._id}/rentals`)
        .set("x-auth-token", nonAdminJWT);

      expect(res.status).toBe(401);
    });

    it("should return 200 if the user that requests another users rentals is an admin", async () => {
      const nonAdmin = new User({ exampleUser });
      const admin = new User({ exampleAdmin, isAdmin: true });
      const adminJWT = admin.generateAuthToken();

      const res = await request(app)
        .get(`/api/users/${nonAdmin._id}/rentals`)
        .set("x-auth-token", adminJWT);

      expect(res.status).toBe(200);
    });

    it("should return 200 if a user requests it's own rentals", async () => {
      const nonAdmin = new User({ exampleUser });
      const nonAdminJWT = nonAdmin.generateAuthToken();

      let exampleProduct = {
        name: "ValidName",
        category: {
          _id: mongoose.Types.ObjectId(),
          name: "categoryName"
        },
        entities: [
          {
            identifier: "Ex1",
            availableForRental: true,
            remarks: "This is a remark"
          }
        ],
        numberOfLoans: 3,
        description: "This is a description",
        details: [
          {
            displayName: "detailName",
            value: "Detail value"
          }
        ]
      };

      exampleProduct1 = new Product({
        _id: mongoose.Types.ObjectId(),
        ...exampleProduct
      });
      exampleProduct1.entities[0].availableForRental = true;

      await exampleProduct1.save();

      await request(app)
        .post("/api/rentals/")
        .send({ productId: exampleProduct1._id })
        .set("x-auth-token", nonAdminJWT);

      const res = await request(app)
        .get(`/api/users/${nonAdmin._id}/rentals`)
        .set("x-auth-token", nonAdminJWT);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].user._id.toString()).toBe(nonAdmin._id.toString());
    });

    it("should return 401 if no JWT token is provided", async () => {
      const nonAdmin = new User({ exampleUser });
      const res = await request(app)
        .get(`/api/users/${nonAdmin._id}/rentals`)
        .set("x-auth-token", "");
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      const nonAdmin = new User({ exampleUser });
      const res = await request(app)
        .get(`/api/users/${nonAdmin._id}/rentals`)
        .set("x-auth-token", "invalid");
      expect(res.status).toBe(400);
    });
  });

  describe("POST /", () => {
    let user;

    beforeEach(() => {
      user = { ...exampleUser };
    });

    const exec = () => {
      return request(app)
        .post("/api/users")
        .send({
          ...user
        });
    };

    it("should return new user when user is valid", async () => {
      res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
    });

    it("Should return 400 when firstName is not given", async () => {
      user.firstName = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 when lastName is not given", async () => {
      user.lastName = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 when lastName is not given", async () => {
      user.lastName = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 when email is not given", async () => {
      user.email = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 when password is not given", async () => {
      user.password = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 when phone is not given", async () => {
      user.phone = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 if user is already registered", async () => {
      await exec();
      res = await exec();
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id", () => {
    let user;
    let id;

    beforeEach(async () => {
      user = { ...exampleUser };
      const userObject = new User({ ...user });
      id = userObject.id;

      await userObject.save();
    });

    const exec = () => {
      return request(app)
        .put(`/api/users/${id}`)
        .send({
          ...user
        })
        .set("x-auth-token", validAdminJWTToken);
    };

    it("should return new user when valid token and user is passed", async () => {
      res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
    });

    it("should return 404 when the user to be updated doesn't exist", async () => {
      id = mongoose.Types.ObjectId();
      res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 400 when name is not provided", async () => {
      user.name = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 when email is not provided", async () => {
      user.email = "";
      res = await exec();
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /:id", () => {
    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      const res = await request(app)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      let res = await request(app)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      let res = await request(app)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(403);
    });

    it("should return 400 if product ID is invalid", async () => {
      const res = await request(app)
        .delete(`/api/users/invalidID`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if user not found", async () => {
      validId = mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/users/${validId}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(404);
    });

    it("should delete user if found", async () => {
      await addExampleUser();

      let res = await request(app)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(200);

      res = await request(app)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(404);
    });

    it("should return deleted user", async () => {
      await addExampleUser();

      const res = await request(app)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
    });
  });
});
