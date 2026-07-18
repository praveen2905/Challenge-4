/**
 * Navigation Routes
 *
 * Provides AI-powered indoor navigation, venue map data, and POI listings.
 * Route generation is crowd-aware — high-density zones are passed as warnings.
 */
import { Router } from "express";
import { Venue } from "../models/Venue.js";
import { CrowdZone } from "../models/CrowdZone.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate } from "../middlewares/authenticate.js";
import { GetNavigationRouteBody } from "../utils/validation.js";
import { generateRoute } from "../services/geminiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { MAP_ZONES, POIS } from "../utils/venueMapData.js";

const router = Router();

/**
 * POST /route — Generate a crowd-aware navigation route between two POIs.
 * Passes high-density zone warnings to the AI for smarter path selection.
 */
router.post(
  "/route",
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = GetNavigationRouteBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const { venueId, origin, destination, accessibility, language } =
      parsed.data;

    // Retrieve high-density zones to warn about congested areas
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
  })
);

/**
 * GET /map/:venueId — Return static venue map layout with zone shapes and POIs.
 */
router.get(
  "/map/:venueId",
  authenticate,
  asyncHandler(async (req, res) => {
    const venue = await Venue.findById(req.params.venueId);

    res.json({
      venueId: venue?._id.toString() || req.params.venueId,
      zones: MAP_ZONES,
      pois: POIS,
    });
  })
);

/**
 * GET /pois — Return the full list of Points of Interest.
 */
router.get("/pois", authenticate, (_req, res) => {
  res.json(POIS);
});

export default router;
