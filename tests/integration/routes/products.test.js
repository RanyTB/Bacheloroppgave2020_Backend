const server = require("../../../index");
const mongoose = require("mongoose");
const request = require("supertest");
const { Product } = require("../../../models/product");
const { Category } = require("../../../models/category");

let exampleProduct;
let exampleId1 = mongoose.Types.ObjectId();
let exampleId2 = mongoose.Types.ObjectId();

let categoryId = mongoose.Types.ObjectId();
let categoryName = "ExampleCategory";

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
  beforeAll(async () => {
    await new Category({ _id: categoryId, name: categoryName }).save();
  });
  afterAll(async () => {
    await Category.deleteMany({});
  });

  beforeEach(async () => {
    setDefaultExampleProduct();
    exampleProduct.category.name = categoryName;
    await addTwoExampleProducts();
    delete exampleProduct.category.name;
  });

  afterEach(async () => {
    await Product.deleteMany({});
  });

  describe("GET /", () => {
    it("should return all products", async () => {
      const res = await request(server).get("/api/products");
      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.some(p => p.name === "Example 1")).toBeTruthy();
      expect(res.body.some(p => p.name === "Example 2")).toBeTruthy();
    });
  });

  describe("GET /:id", () => {
    it("should return one product", async () => {
      const res = await request(server).get(`/api/products/${exampleId1}`);
      expect(res.status).toBe(200);
      expectProductPropertiesInResponse(res);
    });

    it("should return 400 if product ID is invalid", async () => {
      const res = await request(server).get(`/api/products/invalidID`);
      expect(res.status).toBe(400);
    });

    it("should return 404 if product does not exist", async () => {
      const validID = mongoose.Types.ObjectId();
      const res = await request(server).get(`/api/products/${validID}`);

      expect(res.status).toBe(404);
    });
  });

  describe("POST /", () => {
    const exec = () => {
      return request(server)
        .post("/api/products")
        .send({
          ...exampleProduct
        });
    };

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

      return request(server)
        .put(`/api/products/${idToBeUpdated}`)
        .send({
          ...exampleProduct
        });
    };

    it("should return return 400 if product ID is invalid", async () => {
      const res = await request(server).put(`/api/products/invalidID`);
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

  describe("DELETE /:id", () => {
    it("should return 400 if product ID is invalid", async () => {
      const res = await request(server).delete(`/api/products/invalidID`);
      expect(res.status).toBe(400);
    });

    it("should return 404 if product not found", async () => {
      validId = mongoose.Types.ObjectId();
      const res = await request(server).delete(`/api/products/${validId}`);

      expect(res.status).toBe(404);
    });

    it("should delete product if found", async () => {
      let res = await request(server).delete(`/api/products/${exampleId1}`);
      expect(res.status).toBe(200);

      res = await request(server).get(`/api/products/${exampleId1}`);
      expect(res.status).toBe(404);
    });

    it("should return deleted product", async () => {
      const res = await request(server).delete(`/api/products/${exampleId1}`);
      expectProductPropertiesInResponse(res);
    });
  });
});
