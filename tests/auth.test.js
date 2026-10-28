const request = require("supertest");
const app = require("../src/app");

describe("Authentication API", () => {
  test("POST /api/auth/login should reject missing credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("POST /api/auth/login should reject incorrect password", async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({
       organizationId: 999999,
      email: "nonexistent@example.com",
      password: "WrongPassword123!"
    });

  expect(response.statusCode).toBe(401);
  expect(response.body.success).toBe(false);
});
});