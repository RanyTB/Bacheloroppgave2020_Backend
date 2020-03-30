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
    _id: nonAdminUser._id,
    name: nonAdminUser.firstName + " " + nonAdminUser.lastName
  },
  product: {
    _id: mongoose.Types.ObjectId(),
    name: exampleProduct.name,
    entity: {
      identifier: exampleProduct.entities[0].identifier
    }
  }
};

let processedRental = {
  user: {
    _id: nonAdminUser._id,
    name: nonAdminUser.firstName + " " + nonAdminUser.lastName
  },
  product: {
    _id: mongoose.Types.ObjectId(),
    name: exampleProduct.name,
    entity: {
      identifier: exampleProduct.entities[0].identifier
    }
  },
  dateOut: Date.now(),
  pickUpInstructions: "Pickup instructions here",
  returnInstructions: "return instructions here"
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

  describe("PATCH /:id", () => {
    let rentalId;
    let pickUpInstructions;
    let returnInstructions;
    let JWTToken;

    beforeEach(async () => {
      const rental = new Rental({ ...unprocessedRental });
      await rental.save();

      rentalId = rental._id;
      pickUpInstructions = "Pickup insuction example";
      returnInstructions = "Return insuction example";
      JWTToken = validAdminToken;
    });

    const exec = () => {
      return request(app)
        .patch(`/api/rentals/${rentalId}`)
        .send({ pickUpInstructions, returnInstructions })
        .set("x-auth-token", JWTToken);
    };

    it("should return 200 if request body and admin token is provided", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it("should return rental with dateOut on 200 response", async () => {
      const res = await exec();
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("product");
      expect(res.body).toHaveProperty("dateOut");
    });

    it("should return 400 if pickUpInstructions is not provided", async () => {
      pickUpInstructions = "";

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if returnInstructions is not provided", async () => {
      returnInstructions = "";

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 if rental id is not a valid mongoose objectId", async () => {
      rentalId = "invalidId";

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if rental id doesn't exist", async () => {
      rentalId = mongoose.Types.ObjectId();

      const res = await exec();
      expect(res.status).toBe(404);
    });

    it("should return 401 if no JWT token is provided", async () => {
      JWTToken = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      JWTToken = "invalid";
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 403 if user is not admin", async () => {
      JWTToken = validNonAdminToken;
      const res = await exec();
      expect(res.status).toBe(403);
    });
  });

  describe("POST /returns/:id", () => {
    let rentalId;
    let JWTToken;
    let remarks;

    beforeEach(async () => {
      const rental = new Rental({ ...processedRental });
      await rental.save();

      rentalId = rental._id;
      JWTToken = validNonAdminToken;
      remarks = "Got some scratches during transport";
    });

    const exec = () => {
      return request(app)
        .post(`/api/rentals/returns/${rentalId}`)
        .send({ remarks })
        .set("x-auth-token", JWTToken);
    };

    it("should return 200 when rental exists", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
    });

    it("should return rental body on 200 response", async () => {
      const res = await exec();

      expect(res.body).toHaveProperty("product");
      expect(res.body).toHaveProperty("user");
      expect(res.body).toHaveProperty("dateReturned");
      expect(res.body).toHaveProperty("remarks");
    });

    it("should return 404 when rental does not exist", async () => {
      rentalId = mongoose.Types.ObjectId();
      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 400 when rental id is invalid", async () => {
      rentalId = "invalid";

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 when user in JWT token is not the same as in rental document", async () => {
      JWTToken = validAdminToken;
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 401 if no JWT token is provided", async () => {
      JWTToken = "";

      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      JWTToken = "invalid";

      const res = await exec();
      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /returns/:id", () => {
    let rentalId;
    let setAvailable;
    let JWTToken;

    beforeEach(async () => {
      let product = { ...exampleProduct };
      product.entities[0].availableForRental = false;
      product = new Product({ _id: exampleId1, ...product });

      let rental = { ...processedRental };
      rental.product._id = product._id;
      rental.product.entity._id = product.entities[0]._id;
      rental.dateReturned = Date.now();
      rental = new Rental({ ...rental });

      await rental.save();
      await product.save();

      rentalId = rental._id;
      setAvailable = true;
      JWTToken = validAdminToken;
    });

    const exec = () => {
      return request(app)
        .patch(`/api/rentals/returns/${rentalId}`)
        .send({ setAvailable })
        .set("x-auth-token", JWTToken);
    };

    it("should return 200 when return is successful", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
    });

    it("should set confirmedReturned to true in rental document", async () => {
      const res = await exec();
      const rental = await Rental.findOne(rentalId);

      expect(res.status).toBe(200);
      expect(rental.confirmedReturned).toBeTruthy();
    });

    it("should set availableforRental to true in product document", async () => {
      const res = await exec();
      const product = await Product.findOne(exampleId1);

      expect(res.status).toBe(200);
      expect(product.entities[0].availableForRental).toBeTruthy();
    });

    it("should set availableforRental to false in product document", async () => {
      setAvailable = false;
      const res = await exec();

      const product = await Product.findOne(exampleId1);

      expect(res.status).toBe(200);
      expect(product.entities[0].availableForRental).toBeFalsy();
    });

    it("should return 400 if setAvailable is missing in request body", async () => {
      setAvailable = undefined;
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 404 if rental does not exist", async () => {
      rentalId = mongoose.Types.ObjectId();
      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return 401 if authentication token is not provided", async () => {
      JWTToken = "";
      const res = await exec();

      expect(res.status).toBe(401);
    });

    it("should return 400 if authentication token is invalid", async () => {
      JWTToken = "invalid";
      const res = await exec();

      expect(res.status).toBe(400);
    });

    it("should return 403 if user is not admin", async () => {
      JWTToken = validNonAdminToken;
      const res = await exec();

      expect(res.status).toBe(403);
    });
  });
});
