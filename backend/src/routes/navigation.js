import { Router } from "express";
import { Venue } from "../models/Venue.js";
import { CrowdZone } from "../models/CrowdZone.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate } from "../middlewares/authenticate.js";
import { GetNavigationRouteBody } from "../utils/validation.js";
import { generateRoute } from "../services/geminiService.js";

const router = Router();

router.post("/route", authenticate, async (req, res) => {
  try {
    const parsed = GetNavigationRouteBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const { venueId, origin, destination, accessibility, language } =
      parsed.data;

    // Get high-density zones to warn about
    const highZones = await CrowdZone.find({
      venueId,
      level: { $in: ["high", "critical"] },
    });
    const crowdWarnings = highZones.map(
      (z) => `${z.name} (${z.densityPercent}% capacity)`
    );

    const result = await generateRoute({
      origin: origin || "Main Entrance",
      destination,
      accessibility: accessibility ?? false,
      language: language || "en",
      crowdWarnings,
    });

    await ActivityLog.create({
      type: "navigation_request",
      message: `Navigation: ${origin || "Entrance"} → ${destination}${accessibility ? " (accessible)" : ""}`,
      userId: req.user.id,
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/map/:venueId", authenticate, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);

    // Static map layout
    const mapZones = [
      {
        id: "Z-ENTRY",
        name: "Main Entrance",
        x: 35,
        y: 85,
        width: 30,
        height: 10,
        type: "transit",
        color: "#3b82f6",
      },
      {
        id: "Z-North",
        name: "North Stand",
        x: 10,
        y: 5,
        width: 80,
        height: 20,
        type: "seating",
        color: "#6366f1",
      },
      {
        id: "Z-South",
        name: "South Stand",
        x: 10,
        y: 70,
        width: 80,
        height: 20,
        type: "seating",
        color: "#6366f1",
      },
      {
        id: "Z-East",
        name: "East Wing",
        x: 75,
        y: 30,
        width: 20,
        height: 35,
        type: "standing",
        color: "#8b5cf6",
      },
      {
        id: "Z-West",
        name: "West Wing",
        x: 5,
        y: 30,
        width: 20,
        height: 35,
        type: "standing",
        color: "#8b5cf6",
      },
      {
        id: "Z-MAIN",
        name: "Main Arena Floor",
        x: 30,
        y: 30,
        width: 40,
        height: 35,
        type: "floor",
        color: "#14b8a6",
      },
      {
        id: "Z-VIP",
        name: "VIP Lounge",
        x: 75,
        y: 5,
        width: 20,
        height: 20,
        type: "vip",
        color: "#f59e0b",
      },
      {
        id: "Z-FOOD",
        name: "Food Court",
        x: 5,
        y: 5,
        width: 20,
        height: 20,
        type: "amenity",
        color: "#10b981",
      },
    ];

    const pois = [
      {
        id: "poi-1",
        name: "Main Entrance",
        type: "entrance",
        zone: "Z-ENTRY",
        x: 50,
        y: 90,
        accessible: true,
      },
      {
        id: "poi-2",
        name: "Emergency Exit A",
        type: "exit",
        zone: "Z-North",
        x: 15,
        y: 10,
        accessible: true,
      },
      {
        id: "poi-3",
        name: "Emergency Exit B",
        type: "exit",
        zone: "Z-South",
        x: 85,
        y: 75,
        accessible: true,
      },
      {
        id: "poi-4",
        name: "Restrooms (Level 1)",
        type: "restroom",
        zone: "Z-West",
        x: 12,
        y: 45,
        accessible: true,
      },
      {
        id: "poi-5",
        name: "Restrooms (Level 2)",
        type: "restroom",
        zone: "Z-East",
        x: 88,
        y: 45,
        accessible: false,
      },
      {
        id: "poi-6",
        name: "Food Court",
        type: "food",
        zone: "Z-FOOD",
        x: 15,
        y: 12,
        accessible: true,
      },
      {
        id: "poi-7",
        name: "Medical Station",
        type: "medical",
        zone: "Z-ENTRY",
        x: 30,
        y: 88,
        accessible: true,
      },
      {
        id: "poi-8",
        name: "Info Desk",
        type: "info",
        zone: "Z-ENTRY",
        x: 70,
        y: 88,
        accessible: true,
      },
      {
        id: "poi-9",
        name: "Main Stage",
        type: "stage",
        zone: "Z-MAIN",
        x: 50,
        y: 47,
        accessible: false,
      },
      {
        id: "poi-10",
        name: "VIP Lounge",
        type: "entrance",
        zone: "Z-VIP",
        x: 85,
        y: 12,
        accessible: true,
      },
    ];

    res.json({
      venueId: venue?._id.toString() || req.params.venueId,
      zones: mapZones,
      pois,
    });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/pois", authenticate, async (_req, res) => {
  res.json([
    {
      id: "poi-1",
      name: "Main Entrance",
      type: "entrance",
      zone: "Z-ENTRY",
      x: 50,
      y: 90,
      accessible: true,
    },
    {
      id: "poi-2",
      name: "Emergency Exit A",
      type: "exit",
      zone: "Z-North",
      x: 15,
      y: 10,
      accessible: true,
    },
    {
      id: "poi-3",
      name: "Emergency Exit B",
      type: "exit",
      zone: "Z-South",
      x: 85,
      y: 75,
      accessible: true,
    },
    {
      id: "poi-4",
      name: "Restrooms (Level 1)",
      type: "restroom",
      zone: "Z-West",
      x: 12,
      y: 45,
      accessible: true,
    },
    {
      id: "poi-5",
      name: "Food Court",
      type: "food",
      zone: "Z-FOOD",
      x: 15,
      y: 12,
      accessible: true,
    },
    {
      id: "poi-6",
      name: "Medical Station",
      type: "medical",
      zone: "Z-ENTRY",
      x: 30,
      y: 88,
      accessible: true,
    },
    {
      id: "poi-7",
      name: "Info Desk",
      type: "info",
      zone: "Z-ENTRY",
      x: 70,
      y: 88,
      accessible: true,
    },
    {
      id: "poi-8",
      name: "Main Stage",
      type: "stage",
      zone: "Z-MAIN",
      x: 50,
      y: 47,
      accessible: false,
    },
    {
      id: "poi-9",
      name: "Parking Area",
      type: "parking",
      zone: "Z-ENTRY",
      x: 20,
      y: 95,
      accessible: true,
    },
    {
      id: "poi-10",
      name: "VIP Lounge",
      type: "entrance",
      zone: "Z-VIP",
      x: 85,
      y: 12,
      accessible: true,
    },
  ]);
});

export default router;
