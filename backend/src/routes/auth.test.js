import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectDB } from "../config/db.js";
import { User } from "../models/User.js";

// MONGODB_URI is set by globalSetup.js (shared MongoMemoryServer)
beforeAll(async () => {
  await connectDB();
}, 60000);

beforeEach(async () => {
  // Clean up test users between tests to avoid duplicate email conflicts
  await User.deleteMany({ email: /testuser.*@venueiq-test\.com/ });
});

const TEST_USER = {
  name: "Test User",
  email: "testuser1@venueiq-test.com",
  password: "securepass123",
  role: "fan",
  language: "en",
};

describe("POST /api/auth/register", () => {
  it("should register a new user and return a token", async () => {
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({
      name: TEST_USER.name,
      email: TEST_USER.email,
      role: TEST_USER.role,
    });
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("should reject duplicate email registration", async () => {
    await request(app).post("/api/auth/register").send(TEST_USER);
    const res = await request(app).post("/api/auth/register").send(TEST_USER);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject registration with invalid email", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, email: "invalid-email" });
    expect(res.status).toBe(400);
  });

  it("should reject registration with short password", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ ...TEST_USER, email: "testuser3@venueiq-test.com", password: "short" });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  beforeEach(async () => {
    // Register a fresh user before each login test
    await request(app).post("/api/auth/register").send(TEST_USER);
  });

  it("should login with correct credentials and return a token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toMatchObject({ email: TEST_USER.email });
    expect(res.body.user).not.toHaveProperty("password");
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: TEST_USER.email,
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });

  it("should reject login with non-existent email", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "nonexistent@venueiq-test.com",
      password: TEST_USER.password,
    });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty("error");
  });
});

describe("GET /api/auth/me", () => {
  it("should return current user when authenticated", async () => {
    const registerRes = await request(app).post("/api/auth/register").send(TEST_USER);
    const token = registerRes.body.token;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ email: TEST_USER.email });
    expect(res.body).not.toHaveProperty("password");
  });

  it("should reject unauthenticated requests", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("should reject requests with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", "Bearer invalid.token.here");
    expect(res.status).toBe(401);
  });
});
