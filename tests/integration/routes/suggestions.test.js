const request = require("supertest");
const mongoose = require("mongoose");
const { Suggestion } = require("../../../models/suggestion");
const { User } = require("../../../models/user");
const app = require("../../../index");

let exampleUser = {
  firstName: "firstName",
  lastName: "lastName",
  email: "exampleUser@address.com",
  password: "password",
  phone: "11111111",
};

let exampleSuggestion = {
  suggestion: "Buy playstation 6",
};

let adminToken = new User({
  firstName: "Mark",
  lastName: "Twain",
  isAdmin: true,
}).generateAuthToken();
let nonAdminToken = new User({
  firstName: "Ernest",
  lastName: "Hemingway",
}).generateAuthToken();

describe("/api/suggestions", () => {
  afterEach(async () => {
    await Suggestion.deleteMany({});
  });

  describe("GET /", () => {
    let currentAdminToken;

    beforeEach(() => {
      currentAdminToken = adminToken;
    });

    const exec = () => {
      return request(app)
        .get("/api/suggestions")
        .set("x-auth-token", currentAdminToken);
    };

    it("should return all suggestions ", async () => {
      let suggestion1 = new Suggestion({ name: "name1", ...exampleSuggestion });
      let suggestion2 = new Suggestion({ name: "name2", ...exampleSuggestion });

      await suggestion1.save();
      await suggestion2.save();

      res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should reutn 401 if no JWT is provided", async () => {
      currentAdminToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT is invalid", async () => {
      currentAdminToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user in not an admin", async () => {
      currentAdminToken = nonAdminToken;
      const res = await exec();
      expect(res.status).toBe(403);
    });
  });

  describe("POST /", () => {
    let suggestion;
    let currentNonAdminToken;

    beforeEach(() => {
      suggestion = exampleSuggestion;
      currentNonAdminToken = nonAdminToken;
    });

    const exec = () => {
      return request(app)
        .post("/api/suggestions")
        .send({
          ...suggestion,
        })
        .set("x-auth-token", currentNonAdminToken);
    };

    it("Should save and return the newly created suggestion, given valid suggestion", async () => {
      res = await exec();
      res2 = await request(app)
        .get("/api/suggestions")
        .set("x-auth-token", adminToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(res2.body.length).toBe(1);
    });

    it("Should retun 400 if suggestion is not provided", async () => {
      suggestion = "";
      res = await exec();
    });

    it("should reutn 400 if JWT token is invalid", async () => {
      currentNonAdminToken = "invalid";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 401 if no JWT is provided", async () => {
      currentNonAdminToken = "";
      res = await exec();

      expect(res.status).toBe(401);
    });
  });
});
