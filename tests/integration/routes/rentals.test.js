request = require("supertest");
mongoose = require("mongoose");
const { Rental } = require("../../../models/rental");
const app = require("../../../index");
const { User } = require("../../../models/user");
const { Product } = require("../../../models/product");

let exampleUser = {
  firstName: "adminFirstName",
  lastName: "adminLastName",
  email: "administrator@address.com",
  password: "adminPassword",
  phone: "22222222"
};

const admin = new User({ ...exampleUser, isAdmin: true });
const nonAdminUser = new User({ ...exampleUser });

const validAdminToken = admin.generateAuthToken();
const validNonAdminToken = nonAdminUser.generateAuthToken();

const exampleId1 = mongoose.Types.ObjectId();

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

let unprocessedRental = {
  user: {
    _id: admin._id,
    name: admin.firstName + " " + admin.lastName
  },
  product: {
    _id: mongoose.Types.ObjectId(),
    name: exampleProduct.name,
    entity: {
      identifier: exampleProduct.entities[0].identifier
    }
  }
};

describe("/api/rentals", () => {
  afterEach(async () => {
    await Product.deleteMany({});
    await User.deleteMany({});
    await Rental.deleteMany({});
  });

  describe("GET /", () => {
    beforeEach(async () => {
      const rental1 = new Rental({ ...unprocessedRental });
      const rental2 = new Rental({ ...unprocessedRental, dateOut: Date.now() });
      await rental1.save();
      await rental2.save();
    });

    it("should return all rentals", async () => {
      const res = await request(app)
        .get("/api/rentals")
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
    });

    it("should return only processed rentals", async () => {
      const res = await request(app)
        .get("/api/rentals?requested=true")
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
    });

    it("should return 401 if no JWT token is provided", async () => {
      const res = await request(app)
        .get("/api/rentals")
        .set("x-auth-token", "");
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      const res = await request(app)
        .get("/api/rentals")
        .set("x-auth-token", "invalid");
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      const res = await request(app)
        .get("/api/rentals")
        .set("x-auth-token", validNonAdminToken);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /returns/", () => {
    beforeEach(async () => {
      const rental1 = new Rental({ ...unprocessedRental, dateOut: Date.now() });
      rental1.dateReturned = Date.now();
      await rental1.save();

      const rental2 = new Rental({ ...unprocessedRental, dateOut: Date.now() });
      rental2.dateReturned = Date.now();
      rental2.confirmedReturned = true;

      await rental2.save();
    });
    it("should return unprocessed returns", async () => {
      const res = await request(app)
        .get("/api/rentals/returns")
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(200);
      expect(res.body[0]).toHaveProperty("dateReturned");
      expect(res.body[0].confirmedReturned).toBe(false);
      expect(res.body.length).toBe(1);
    });

    it("Should return processed returns", async () => {
      const res = await request(app)
        .get("/api/rentals/returns?processed=true")
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(200);
      expect(res.body[0].confirmedReturned).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it("should return 401 if no JWT token is provided", async () => {
      const res = await request(app)
        .get("/api/rentals/returns")
        .set("x-auth-token", "");
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      const res = await request(app)
        .get("/api/rentals/returns")
        .set("x-auth-token", "invalid");
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      const res = await request(app)
        .get("/api/rentals/returns")
        .set("x-auth-token", validNonAdminToken);
      expect(res.status).toBe(403);
    });
  });

  describe("POST /", () => {
    let availableForRental;
    beforeEach(async () => {
      availableForRental = true;
    });

    exec = async () => {
      exampleProduct1 = new Product({
        _id: exampleId1,
        ...exampleProduct
      });
      exampleProduct1.entities[0].availableForRental = availableForRental;

      await exampleProduct1.save();
    };
    it("should return new rental when requested with valid product that is available", async () => {
      await exec();
      const res = await request(app)
        .post("/api/rentals")
        .send({
          productId: exampleProduct1._id
        })
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(200);
      expect(res.body.confirmedReturned).toBe(false);
      expect(res.body).toHaveProperty("_id");
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("product");
      expect(res.body.user._id.toString()).toBe(admin._id.toString());
      expect(res.body.product._id.toString()).toBe(
        exampleProduct1._id.toString()
      );
    });

    it("should return 404 if product is not found", async () => {
      await exec();

      const res = await request(app)
        .post("/api/rentals")
        .send({
          productId: mongoose.Types.ObjectId()
        })
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(404);
    });

    it("should return 400 if no entities are available", async () => {
      availableForRental = false;
      await exec();

      const res = await request(app)
        .post("/api/rentals")
        .send({
          productId: exampleProduct1._id
        })
        .set("x-auth-token", validAdminToken);

      expect(res.status).toBe(400);
    });

    it("should return 401 if no JWT token is provided", async () => {
      const res = await request(app)
        .post("/api/rentals")
        .set("x-auth-token", "");
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      const res = await request(app)
        .post("/api/rentals")
        .set("x-auth-token", "invalid");
      expect(res.status).toBe(400);
    });
  });
});
