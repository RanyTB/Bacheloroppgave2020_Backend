let server;
const mongoose = require("mongoose");
const request = require("supertest");
const { Product } = require("../../models/product");

let exampleProduct;
let exampleId1 = mongoose.Types.ObjectId();
let exampleId2 = mongoose.Types.ObjectId();

setExampleProduct = () => {
  exampleProduct = {
    name: "ValidName",
    category: {
      _id: mongoose.Types.ObjectId(),
      name: "CategoryName"
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

describe("/api/products", () => {
  beforeEach(async () => {
    server = require("../../index");
    setExampleProduct();
    await addTwoExampleProducts();
  });
  afterEach(async () => {
    await Product.remove({});
    await server.close();
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
  });
});
