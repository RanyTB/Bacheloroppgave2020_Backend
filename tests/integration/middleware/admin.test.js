const request = require("supertest");
const server = require("../../../index");
const { User } = require("../../../models/user");

let exampleAuthUser = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "administratorTest@address1.com",
  password: "password1",
  phone: "11111111"
};

describe("admin middleware", () => {
  let authUser;
  let token;
  let isAdmin = false;

  beforeEach(async () => {});
  afterEach(async () => {
    await User.deleteMany({});
  });

  const exec = () => {
    authUser = new User({ ...exampleAuthUser, isAdmin: isAdmin });
    token = authUser.generateAuthToken();

    return request(server)
      .get(`/api/users/`)
      .set("x-auth-token", token);
  };

  it("should return 403 if user is not admin", async () => {
    const res = await exec();

    expect(res.status).toBe(403);
  });

  it("should not return 200 if user is admin", async () => {
    isAdmin = true;

    const res = await exec();
    expect(res.status).toBe(200);
  });
});
