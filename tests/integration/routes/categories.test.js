const mongoose = require("mongoose");
const request = require("supertest");
const app = require("../../../index");
const { Category } = require("../../../models/category");
const { User } = require("../../../models/user");

const mainCategoryId = mongoose.Types.ObjectId();
const subCategoryId = mongoose.Types.ObjectId();
let mainCategory;
let subCategory;

const exampleUser = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "email@address1.com",
  password: "password1",
  phone: "11111111"
};

describe("/api/categories", () => {
  let validAdminJWTToken;
  let validAuthNonAdminUserJWTToken;
  beforeEach(async () => {
    mainCategory = new Category({
      _id: mainCategoryId,
      name: "mainCategory"
    });

    subCategory = new Category({
      _id: subCategoryId,
      name: "subCategory",
      parent: {
        _id: mainCategoryId,
        name: "mainCategory"
      }
    });

    await mainCategory.save();
    await subCategory.save();

    validAdminJWTToken = await new User({
      ...exampleUser,
      isAdmin: true
    }).generateAuthToken();

    validAuthNonAdminUserJWTToken = await new User({
      ...exampleUser
    }).generateAuthToken();
  });

  afterEach(async () => {
    await Category.deleteMany({});
  });

  describe("GET /", () => {
    const exec = () => {
      return request(app)
        .get("/api/categories")
        .set("x-auth-token", validAuthNonAdminUserJWTToken);
    };

    it("should return all categories", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body[0]).toHaveProperty("name");
      expect(res.body[1]).toHaveProperty("parent");
      expect(res.body[1]).toHaveProperty("parent._id");
      expect(res.body[1]).toHaveProperty("parent.name");
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
    const exec = () => {
      return request(app)
        .get(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);
    };

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

    it("should return one category", async () => {
      const res = await request(app)
        .get(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name");
    });

    it("should return 404 when category with given id does not exist", async () => {
      const res = await request(app)
        .get(`/api/categories/${mongoose.Types.ObjectId()}`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);
      expect(res.status).toBe(404);
    });

    it("should return 400 when id is invalid", async () => {
      const res = await request(app)
        .get(`/api/categories/invalidId`)
        .set("x-auth-token", validAuthNonAdminUserJWTToken);
      expect(res.status).toBe(400);
    });
  });

  describe("POST /", () => {
    let name;
    let parent;

    beforeEach(() => {
      name = "newCategory";
      parent = {
        _id: mainCategoryId
      };
    });

    const exec = () => {
      const category = parent
        ? {
            name,
            parent
          }
        : {
            name
          };

      return request(app)
        .post("/api/categories")
        .send(category)
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

    it("should return new category with parent", async () => {
      const res = await exec();
      expect(res.status).toBe(200);
      expect(res.body.name).toEqual(name);
      expect(res.body).toHaveProperty("parent");
      expect(res.body).toHaveProperty("parent._id");
      expect(res.body).toHaveProperty("parent.name");
    });

    it("should return a new category without parent", async () => {
      parent = null;
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name");
      expect(res.body).not.toHaveProperty("parent");
    });

    it("should return 400 when parent id is not a valid id", async () => {
      parent._id = "invalidId";

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 when parent has a parent", async () => {
      parent._id = subCategoryId;

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 400 when parent name is given", async () => {
      parent.name = "SomeName";

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 when parent with given id does not exist", async () => {
      parent._id = mongoose.Types.ObjectId();

      const res = await exec();
      expect(res.status).toBe(404);
    });
  });

  //todo refaktorer til å bruke exec() testing
  describe("DELETE /:id", () => {
    it("should return 401 if no JWT token is provided", async () => {
      validAdminJWTToken = "";
      const res = await request(app)
        .delete(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(401);
    });

    it("should return 400 if JWT token is invalid", async () => {
      validAdminJWTToken = "invalid";
      const res = await request(app)
        .delete(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(400);
    });

    it("should return 403 if the authenticated user is not an admin", async () => {
      validAdminJWTToken = validAuthNonAdminUserJWTToken;
      const res = await request(app)
        .delete(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAdminJWTToken);
      expect(res.status).toBe(403);
    });

    it("should return deleted category", async () => {
      const res = await request(app)
        .delete(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("name");
    });

    it("should delete category", async () => {
      await request(app)
        .delete(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAdminJWTToken);

      const res = await request(app)
        .get(`/api/categories/${mainCategoryId}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(404);
    });

    it("should return 404 when category with given id does not exist", async () => {
      const res = await request(app)
        .delete(`/api/categories/${mongoose.Types.ObjectId()}`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(404);
    });

    it("should return 400 when id is invalid", async () => {
      const res = await request(app)
        .delete(`/api/categories/invalidId`)
        .set("x-auth-token", validAdminJWTToken);

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /:id", () => {
    let newMainCategoryId = mongoose.Types.ObjectId();

    let idToUpdate;
    let nameToUpdate;
    let parentToUpdate;

    beforeEach(async () => {
      await new Category({
        _id: newMainCategoryId,
        name: "newMaincategory"
      }).save();

      idToUpdate = subCategoryId;
      nameToUpdate = "updatedName";
      parentToUpdate = {
        _id: newMainCategoryId
      };
    });

    const exec = () => {
      const updatedCategory = {
        name: nameToUpdate,
        parent: parentToUpdate
      };

      return request(app)
        .put(`/api/categories/${idToUpdate}`)
        .send(updatedCategory)
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

    it("should return updated category", async () => {
      const res = await exec();

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(nameToUpdate);
      expect(res.body.parent._id).toBe(newMainCategoryId.toHexString());
    });

    it("should return 400 if parent has parent", async () => {
      parentToUpdate = {
        _id: subCategoryId
      };

      const res = await exec();
      expect(res.status).toBe(400);
    });

    it("should return 404 if parent does not exist", async () => {
      parentToUpdate = {
        _id: mongoose.Types.ObjectId()
      };
      const res = await exec();
      expect(res.status).toBe(404);
    });
  });
});
