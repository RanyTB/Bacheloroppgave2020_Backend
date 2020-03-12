const app = require("../../../index");
const mongoose = require("mongoose");
const request = require("supertest");
const { Product } = require("../../../models/product");
const { Category } = require("../../../models/category");
const { User } = require("../../../models/user");

let exampleProduct;
let exampleId1 = mongoose.Types.ObjectId();
let exampleId2 = mongoose.Types.ObjectId();

let categoryId = mongoose.Types.ObjectId();
let categoryName = "ExampleCategory";

const exampleUser = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "email@address1.com",
  password: "password1",
  phone: "11111111"
};

setDefaultExampleProduct = () => {
  exampleProduct = {
    name: "ValidName",
    category: {
      _id: categoryId
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
};

addTwoExampleProducts = async () => {
  exampleProduct1 = new Product({
    _id: exampleId1,
    ...exampleProduct
  });
  exampleProduct1.name = "Example 1";
  exampleProduct2 = new Product({
    _id: exampleId2,
    ...exampleProduct
  });
  exampleProduct2.name = "Example 2";

  await exampleProduct1.save();
  await exampleProduct2.save();
};

expectProductPropertiesInResponse = res => {
  const properties = [
    "name",
    "category",
    "entities",
    "numberOfLoans",
    "description",
    "details"
  ];

  properties.map(property => {
    expect(res.body).toHaveProperty(property);
  });
};

describe("/api/products", () => {
  let validAdminJWTToken;
  let validAuthNonAdminUserJWTToken;

  beforeAll(async () => {
    await new Category({ _id: categoryId, name: categoryName }).save();
  });

  beforeEach(async () => {
    setDefaultExampleProduct();
    exampleProduct.category.name = categoryName;
    await addTwoExampleProducts();
    delete exampleProduct.category.name;

    validAdminJWTToken = await new User({
      ...exampleUser,
      isAdmin: true
    }).generateAuthToken();

    validAuthNonAdminUserJWTToken = await new User({
      ...exampleUser
    }).generateAuthToken();
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  afterAll(async () => {
    await Category.deleteMany({});
  });

  describe("GET /", () => {
    exec = () => {
      return request(app)
        .get("/api/products")
        .set("x-auth-token", validAuthNonAdminUserJWTToken);
    };

    it("should return all products", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(p => p.name === "Example 1")).toBeTruthy();
      expect(res.body.some(p => p.name === "Example 2")).toBeTruthy();
    });

    it("should return 401 if no JWT token is provided", async () => {
      validAuthNonAdminUserJWTToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAuthNonAdminUserJWTToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });
  });

  describe("GET /:id", () => {
    it("should return one product", async () => {
      const res = await request(app)
        .get(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);

      expect(res.status).toBe(200);
      expectProductPropertiesInResponse(res);
    });

    it("should return 400 if product ID is invalid", async () => {
      const res = await request(app)
        .get(`/api/products/invalidID`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 404 if product does not exist", async () => {
      const validID = mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/products/${validID}`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    const exec = () => {
      return request(app)
        .post("/api/products")
        .send({
          ...exampleProduct
        })
        .set("x-auth-token", validAdminJWTToken);
    };

    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return new product when product is valid", async () => {
      res = await exec();
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("_id");
    });

    it("should return 400 when name is not given", async () => {
      exampleProduct.name = "";
      res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 400 when category.name is not given", async () => {
      exampleProduct.category = {
        name: ""
      };
      res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 400 when entities is not given", async () => {
      exampleProduct.entities = {};
      res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 400 when numberOfLoans is a negative number", async () => {
      exampleProduct.numberOfLoans = -2;
      res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 400 when description is empty", async () => {
      exampleProduct.description = "";
      res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 400 when details is undefined", async () => {
      delete exampleProduct.details;
      res = await exec();
      expect(res.status).toBe(400);
    });
    it("should return 404 when category does not exist in database", async () => {
      exampleProduct.category._id = mongoose.Types.ObjectId();
      res = await exec();
      expect(res.status).toBe(404);
    });
    it("should return 400 when category has an invalid ID", async () => {
      exampleProduct.category._id = "invalidId";
      res = await exec();
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id", () => {
    let idToBeUpdated;
    let nameAfterUpdate;

    beforeEach(() => {
      nameAfterUpdate = "updatedName";
      idToBeUpdated = exampleId1;
    });

    const exec = () => {
      exampleProduct.name = nameAfterUpdate;

      return request(app)
        .put(`/api/products/${idToBeUpdated}`)
        .send({
          ...exampleProduct
        })
        .set("x-auth-token", validAdminJWTToken);
    };

    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      const res = await exec();
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      const res = await exec();
      expect(res.status).toBe(403);
    });

    it("should return return 400 if product ID is invalid", async () => {
      const res = await request(app)
        .put(`/api/products/invalidID`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 400 if product is invalid", async () => {
      nameAfterUpdate = "";
      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("Should return 404 if product is not found", async () => {
      idToBeUpdated = mongoose.Types.ObjectId();
      const res = await exec();

      expect(res.status).toBe(404);
    });

    it("should return updated product", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.name).toEqual(nameAfterUpdate);
      expectProductPropertiesInResponse(res);
    });
  });

  //TODO: refactor with exec() function
  describe("DELETE /:id", () => {
    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      let res = await request(app)
        .delete(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      let res = await request(app)
        .delete(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      let res = await request(app)
        .delete(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(403);
    });

    it("should return 400 if product ID is invalid", async () => {
      const res = await request(app)
        .delete(`/api/products/invalidID`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(400);
    });

    it("should return 404 if product not found", async () => {
      validId = mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/products/${validId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(404);
    });

    it("should delete product if found", async () => {
      let res = await request(app)
        .delete(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(200);

      res = await request(app)
        .get(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(404);
    });

    it("should return deleted product", async () => {
      const res = await request(app)
        .delete(`/api/products/${exampleId1}`)
        .set("x-auth-token", validAdminJWTToken);
      expectProductPropertiesInResponse(res);
    });
  });
});
