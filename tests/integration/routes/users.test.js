const request = require("supertest");
const mongoose = require("mongoose");
const { User } = require("../../../models/user");
const server = require("../../../index");
const express = require("express");

server.use(express.json());

let exampleUser;
let exampleUserId = mongoose.Types.ObjectId();
let exampleId1 = mongoose.Types.ObjectId();

let exampleAdmin;

exampleAdmin = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "administrator@address1.com",
  password: "password1",
  phone: "11111111"
};

let exampleUser2 = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "exampleUser2@address1.com",
  password: "password1",
  phone: "11111111"
};

addExampleUser = async () => {
  exampleUser = {
    firstName: "firstName1",
    lastName: "lastName1",
    email: "email@address1.com",
    password: "password1",
    phone: "11111111"
  };

  let user = new User({
    _id: exampleUserId,
    ...exampleUser
  });

  await user.save();
};

let validAdminJWTToken;
let admin;

describe("/api/users", () => {
  beforeEach(async () => {
    admin = new User({
      _id: exampleId1,
      ...exampleAdmin,
      isAdmin: true
    });

    admin.save();

    validAdminJWTToken = admin.generateAuthToken();
  });
  afterEach(async () => {
    await User.remove({});
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

      const res = await request(server)
        .get("/api/users")
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3); //requires admin functionality, so admin user is also saved in the test database.
      expect(res.body.some(g => g.email === "email@address1.com")).toBeTruthy();
      expect(res.body.some(g => g.email === "email@address2.com")).toBeTruthy();
    });
  });
  describe("GET /:id", () => {
    it("should return a user when a valid ID is passed", async () => {
      await addExampleUser();

      const res = await request(server)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(200);
      expect(res.body.email === exampleUser.email).toBeTruthy();
    });

    it("should return 400 if user ID is invalid", async () => {
      const res = await request(server)
        .get("/api/users/invalidID")
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if user does not exist", async () => {
      const validID = mongoose.Types.ObjectId();
      const res = await request(server)
        .get(`/api/users/${validID}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    let user;

    beforeEach(() => {
      user = { ...exampleUser2 };
    });

    const exec = () => {
      return request(server)
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
      console.log(user);
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id", () => {
    let user;
    let id;
    console.log(exampleAdmin);

    beforeEach(async () => {
      user = { ...exampleUser2 };
      const userObject = new User({ ...user });
      id = userObject.id;

      await userObject.save();
    });

    const exec = () => {
      return request(server)
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
      id = exampleId1;
      res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 400 when name is not provided", async () => {
      id = exampleId1;
      user.name = "";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 when email is not provided", async () => {
      id = exampleId1;
      user.email = "";
      res = await exec();
      expect(res.status).toBe(400);
    });
  });

  describe("DELETE /:id", () => {
    it("should return 400 if product ID is invalid", async () => {
      const res = await request(server)
        .delete(`/api/users/invalidID`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if user not found", async () => {
      validId = mongoose.Types.ObjectId();
      const res = await request(server)
        .delete(`/api/users/${validId}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(404);
    });

    it("should delete user if found", async () => {
      await addExampleUser();

      let res = await request(server)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(200);

      res = await request(server)
        .get(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(404);
    });

    it("should return deleted user", async () => {
      await addExampleUser();

      const res = await request(server)
        .delete(`/api/users/${exampleUserId}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
    });
  });
});
