const request = require("supertest");
const mongoose = require("mongoose");
const { ServiceMessage } = require("../../../models/serviceMessage");
const { User } = require("../../../models/user");
const app = require("../../../index");

let exampleServiceMessage = {
  serviceMessage: "Due to illness I can't deliver any products this week",
};

let adminToken = new User({
  isAdmin: true,
}).generateAuthToken();
let nonAdminToken = new User({}).generateAuthToken();

describe("/api/serviceMessages", () => {
  afterEach(async () => {
    await ServiceMessage.deleteMany({});
  });

  describe("GET /", () => {
    let currentNonAdminToken;

    beforeEach(() => {
      currentNonAdminToken = nonAdminToken;
    });

    const exec = () => {
      return request(app)
        .get("/api/service-messages")
        .set("x-auth-token", currentNonAdminToken);
    };

    it("Should return all serviceMessages", async () => {
      let serviceMessage = new ServiceMessage({ serviceMessage: "sup" });
      await serviceMessage.save();

      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      //expect(res.body).toHaveProperty("_id");
    });

    it("should return 400 if JWT is invalid", async () => {
      currentNonAdminToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 401 if no JWT is provided", async () => {
      currentNonAdminToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });
  });

  describe("POST /", () => {
    let currentAdminToken;

    beforeEach(() => {
      currentAdminToken = adminToken;
      serviceMessage = exampleServiceMessage;
    });

    const exec = () => {
      return request(app)
        .post("/api/service-messages")
        .send({ ...serviceMessage })
        .set("x-auth-token", currentAdminToken);
    };

    it("Should save and return the newly created service message, given valid service message", async () => {
      res = await exec();

      allServiceMessages = await request(app)
        .get("/api/service-messages/")
        .set("x-auth-token", currentAdminToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
      expect(allServiceMessages.body.length).toBe(1);
    });

    it("should return 400 if service message is not provided", async () => {
      serviceMessage.serviceMessage = "";
      res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 400 if service message is too long", async () => {
      serviceMessage.serviceMessage = "a".repeat(4001);
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if jwt is invalid", async () => {
      currentAdminToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 401 if no JWT is provided", async () => {
      currentAdminToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });
    it("should return 403 if the authenticated user is not an admin", async () => {
      currentAdminToken = nonAdminToken;
      const res = await exec();
      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /", () => {
    let serviceMessageId;
    let currentAdminToken;
    beforeEach(async () => {
      currentAdminToken = adminToken;
      const serviceMessage = new ServiceMessage({
        serviceMessage: "service message",
      });
      serviceMessageId = serviceMessage._id;
      await serviceMessage.save();
    });

    const exec = () => {
      return request(app)
        .delete(`/api/service-messages/${serviceMessageId}`)
        .set("x-auth-token", currentAdminToken);
    };

    it("should delete service message with the given ID", async () => {
      let allServiceMessages = await request(app)
        .get("/api/service-messages")
        .set("x-auth-token", currentAdminToken);

      expect(allServiceMessages.body.length).toBe(1);

      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");

      allServiceMessages = await request(app)
        .get("/api/service-messages")
        .set("x-auth-token", currentAdminToken);

      expect(allServiceMessages.body.length).toBe(0);
    });

    it("should return 404 if the service message with the given ID does not exist", async () => {
      serviceMessageId = mongoose.Types.ObjectId();
      res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 400 if service message ID is invalid", async () => {
      serviceMessageId = "invalid";
      res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if jwt is invalid", async () => {
      currentAdminToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      currentAdminToken = nonAdminToken;
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return 401 if no JWT is provided", async () => {
      currentAdminToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });
  });
});
