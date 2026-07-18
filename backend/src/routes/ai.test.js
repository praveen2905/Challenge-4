import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import request from "supertest";
import app from "../app.js";
import { connectDB, disconnectDB } from "../config/db.js";
import { User } from "../models/User.js";
import { CrowdZone } from "../models/CrowdZone.js";
import { Venue } from "../models/Venue.js";
import { generateToken } from "../middlewares/authenticate.js";
import mongoose from "mongoose";

// Mock the getGeminiClient config
vi.mock("../config/gemini.js", () => {
  return {
    getGeminiClient: () => ({
      getGenerativeModel: () => ({
        generateContent: async (prompt) => {
          // Return simulated JSON responses matching prompts
          let textResult = "";
          if (prompt.includes("safety analyst")) {
            textResult = JSON.stringify({
              riskLevel: "medium",
              summary: "Simulated crowd analysis report.",
              recommendations: ["Simulated Recommendation 1", "Simulated Recommendation 2"],
              affectedZones: ["Z-South"],
              predictedSurge: false
            });
          } else if (prompt.includes("smart indoor navigation")) {
            textResult = JSON.stringify({
              route: [
                { step: 1, instruction: "Head north from start", distance: "20m", landmark: "North Entrance" },
                { step: 2, instruction: "Arrive at destination", distance: "10m", landmark: "VIP Area" }
              ],
              estimatedTime: "2 minutes",
              distance: "30m",
              accessibilityInfo: "Elevator access ok"
            });
          } else if (prompt.includes("operations advisor")) {
            textResult = JSON.stringify({
              recommendation: "Deploy staff to Main Entrance.",
              priority: "high",
              actions: ["Action A", "Action B"],
              reasoning: "High density observed."
            });
          }
          return {
            response: {
              text: () => textResult
            }
          };
        },
        startChat: () => ({
          sendMessage: async () => ({
            response: {
              text: () => "Hello, this is a simulated AI message."
            }
          })
        })
      })
    }),
    isGeminiAvailable: () => true
  };
});

describe("AI Endpoints API", () => {
  let adminToken;
  let staffToken;
  let testVenue;
  let testZone;

  beforeAll(async () => {
    await connectDB();

    const adminId = new mongoose.Types.ObjectId();
    const staffId = new mongoose.Types.ObjectId();

    await User.create([
      {
        _id: adminId,
        name: "AI Admin",
        email: "ai-admin@venueiq-test.com",
        password: "securepass123",
        role: "admin",
      },
      {
        _id: staffId,
        name: "AI Staff",
        email: "ai-staff@venueiq-test.com",
        password: "securepass123",
        role: "staff",
      }
    ]);

    adminToken = generateToken(adminId.toString(), "ai-admin@venueiq-test.com", "admin", "AI Admin");
    staffToken = generateToken(staffId.toString(), "ai-staff@venueiq-test.com", "staff", "AI Staff");

    testVenue = await Venue.create({
      name: "AI Test Arena",
      totalCapacity: 1000,
      address: "100 AI Blvd",
      amenities: ["WiFi"],
      zones: [{ id: "Z-South", name: "South Area", capacity: 500, type: "seating" }]
    });

    testZone = await CrowdZone.create({
      zoneId: "Z-South",
      name: "South Area",
      count: 200,
      capacity: 500,
      venueId: testVenue._id.toString()
    });
  }, 60000);

  afterAll(async () => {
    await Venue.deleteMany({ name: "AI Test Arena" });
    await CrowdZone.deleteMany({ zoneId: "Z-South" });
    await User.deleteMany({ email: /ai-.*@venueiq-test\.com/ });
    await disconnectDB();
  });

  describe("POST /api/crowd/analyze", () => {
    it("should perform crowd analysis with AI mock response", async () => {
      const res = await request(app)
        .post("/api/crowd/analyze")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ venueId: testVenue._id.toString(), context: "Opening ceremony starting soon" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("riskLevel");
      expect(res.body.aiPowered).toBe(true);
      expect(res.body.affectedZones).toContain("Z-South");
    });
  });

  describe("POST /api/navigation/route", () => {
    it("should generate indoor route with AI mock response", async () => {
      const res = await request(app)
        .post("/api/navigation/route")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({
          venueId: testVenue._id.toString(),
          origin: "Entrance",
          destination: "VIP Area",
          accessibility: true
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("route");
      expect(res.body.aiPowered).toBe(true);
      expect(res.body.route.length).toBeGreaterThan(0);
    });
  });

  describe("POST /api/chat/message", () => {
    it("should chat with simulated AI response", async () => {
      const res = await request(app)
        .post("/api/chat/message")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ message: "Where is the main stage?" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("reply");
      expect(res.body.aiPowered).toBe(true);
    });
  });

  describe("POST /api/decisions/query", () => {
    it("should provide decision support recommendations", async () => {
      const res = await request(app)
        .post("/api/decisions/query")
        .set("Authorization", `Bearer ${staffToken}`)
        .send({ query: "Should we allocate more staff to exit A?" });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("recommendation");
      expect(res.body.aiPowered).toBe(true);
      expect(res.body.priority).toBe("high");
    });
  });
});
