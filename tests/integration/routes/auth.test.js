const server = require("../../../index");
const mongoose = require("mongoose");
const request = require("supertest");
const { User } = require("../../../models/user");

let exampleAuthUser = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "administratorTest@address1.com",
  password: "12345678",
  phone: "11111111"
};

let authUser;

describe("api/auth", () => {
  describe("POST /", () => {
    beforeEach(async () => {});

    afterEach(async () => {
      await User.deleteMany({});
      authUser = { ...exampleAuthUser };
      isActive = true;
    });

    let isActive = true;
    authUser = { ...exampleAuthUser };

    const exec = async () => {
      const res = await request(server)
        .post("/api/users")
        .send({ ...exampleAuthUser });

      const user = await User.findOne({ email: exampleAuthUser.email });

      if (user) {
        user.isActive = isActive;
        await user.save();
      }

      return await request(server)
        .post("/api/auth")
        .send({
          email: authUser.email,
          password: authUser.password
        });
    };

    it("should return a JWT token if email and password is correct", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.text).not.toBe(null);
    });

    it("Should return 400 if email is incorrect", async () => {
      authUser.email = "incorrect@gmail.com";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 if password is incorrect", async () => {
      authUser.password = "incorrectPassword";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 if email is invalid", async () => {
      authUser.email = "invalidEmail";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 400 if password is invald", async () => {
      authUser.password = "invpass";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 403 if user is inactive(email has not been verified)", async () => {
      isActive = false;
      const res = await exec();
      expect(res.status).toBe(403);
    });
  });

  describe("POST /token/:jwt", () => {
    afterEach(async () => {
      await User.deleteMany({});
    });

    it("should return 400 if token is invalid", async () => {
      const res = await request(server).post("/api/auth/token/invalidToken");

      expect(res.status).toBe(400);
    });

    it("should return 200 if token is valid", async () => {
      const user = new User({ ...authUser });

      await user.save();

      const emailToken = await user.generateEmailToken();

      const res = await request(server).post(`/api/auth/token/${emailToken}`);

      expect(res.status).toBe(200);
    });
  });
});
