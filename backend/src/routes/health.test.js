import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";

// MONGODB_URI is set by globalSetup.js (shared MongoMemoryServer)
beforeAll(async () => {
  await connectDB();
}, 60000);

afterAll(async () => {
  await disconnectDB();
});

describe("GET /api/health", () => {
  it("should return 200 with status ok", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status", "ok");
    expect(res.body).toHaveProperty("timestamp");
  });

  it("should return a valid ISO 8601 timestamp", async () => {
    const res = await request(app).get("/api/health");
    const ts = new Date(res.body.timestamp);
    expect(ts.toISOString()).toBe(res.body.timestamp);
  });
});

describe("Unmatched routes", () => {
  it("should return 404 for unknown routes", async () => {
    const res = await request(app).get("/api/nonexistent-route-xyz");
    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty("error", "Not Found");
  });
});
