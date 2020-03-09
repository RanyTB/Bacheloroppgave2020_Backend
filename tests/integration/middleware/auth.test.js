const request = require("supertest");
const server = require("../../../index");
const { User } = require("../../../models/user");
const mongoose = require("mongoose");
const express = require("express");

let exampleAuthUser = {
  firstName: "firstName1",
  lastName: "lastName1",
  email: "administratorTest@address1.com",
  password: "password1",
  phone: "11111111"
};

let authUser;

describe("auth middleware", () => {
  let token;

  beforeEach(async () => {
    authUser = new User({ ...exampleAuthUser });
    token = authUser.generateAuthToken();
  });
  afterEach(async () => {
    await User.deleteMany({});
  });

  const exec = () => {
    return request(server)
      .get(`/api/users/me`)
      .set("x-auth-token", token);
  };

  it("should return an authenticated user if supplied jwt token i valid", async () => {
    await authUser.save();
    res = await exec();

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("_id");
  });

  it("should return 401 if no token is provided", async () => {
    token = "";
    const res = await exec();

    expect(res.status).toBe(401);
  });

  it("should return 400 if token is invalid", async () => {
    token = "a";
    const res = await exec();

    expect(res.status).toBe(400);
  });
});
