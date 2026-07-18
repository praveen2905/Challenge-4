import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { Venue } from "../models/Venue.js";
import { User } from "../models/User.js";
import { generateToken } from "../middlewares/authenticate.js";
import mongoose from "mongoose";

beforeAll(async () => {
  await connectDB();
}, 60000);

afterAll(async () => {
  await disconnectDB();
});

describe("Venues API", () => {
  let adminToken;
  let fanToken;
  let existingVenue;

  beforeEach(async () => {
    await Venue.deleteMany({});
    await User.deleteMany({ email: { $in: ["admin@venueiq-test.com", "fan@venueiq-test.com"] } });

    const adminId = new mongoose.Types.ObjectId();
    const fanId = new mongoose.Types.ObjectId();

    // Create users in db so authenticate middleware findById works
    await User.create([
      {
        _id: adminId,
        name: "Test Admin",
        email: "admin@venueiq-test.com",
        password: "securepass123",
        role: "admin",
      },
      {
        _id: fanId,
        name: "Test Fan",
        email: "fan@venueiq-test.com",
        password: "securepass123",
        role: "fan",
      },
    ]);

    // Generate tokens
    adminToken = generateToken(
      adminId.toString(),
      "admin@venueiq-test.com",
      "admin",
      "Test Admin"
    );

    fanToken = generateToken(
      fanId.toString(),
      "fan@venueiq-test.com",
      "fan",
      "Test Fan"
    );

    // Create a base venue for testing GET
    existingVenue = await Venue.create({
      name: "Test Center",
      totalCapacity: 5000,
      address: "123 Test St",
      amenities: ["WiFi", "Parking"],
      zones: [
        { id: "Z-1", name: "Zone One", capacity: 2500, type: "seating" },
        { id: "Z-2", name: "Zone Two", capacity: 2500, type: "standing" },
      ],
    });
  });

  describe("GET /api/venues", () => {
    it("should return 200 and list all venues if authenticated", async () => {
      const res = await request(app)
        .get("/api/venues")
        .set("Authorization", `Bearer ${fanToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
      expect(res.body[0].name).toBe("Test Center");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/venues");
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/venues/:venueId", () => {
    it("should return 200 and details of specific venue", async () => {
      const res = await request(app)
        .get(`/api/venues/${existingVenue._id}`)
        .set("Authorization", `Bearer ${fanToken}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Test Center");
      expect(res.body.totalCapacity).toBe(5000);
    });

    it("should return 404 if venue is not found", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/venues/${fakeId}`)
        .set("Authorization", `Bearer ${fanToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Venue not found");
    });
  });

  describe("POST /api/venues", () => {
    const NEW_VENUE = {
      name: "New Arena",
      totalCapacity: 10000,
      address: "456 Arena Way",
      amenities: ["VIP Suite"],
    };

    it("should allow admin to create a venue", async () => {
      const res = await request(app)
        .post("/api/venues")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(NEW_VENUE);

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("New Arena");
      expect(res.body.totalCapacity).toBe(10000);

      // Verify stored in DB
      const stored = await Venue.findById(res.body.id);
      expect(stored).not.toBeNull();
      expect(stored.name).toBe("New Arena");
    });

    it("should deny fan from creating a venue", async () => {
      const res = await request(app)
        .post("/api/venues")
        .set("Authorization", `Bearer ${fanToken}`)
        .send(NEW_VENUE);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Forbidden");
    });

    it("should return 400 for validation errors", async () => {
      const res = await request(app)
        .post("/api/venues")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Incomplete Venue" }); // missing address/totalCapacity

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error", "Validation error");
    });
  });
});
