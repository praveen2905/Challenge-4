/**
 * Decision Support Routes
 *
 * AI-powered operational decision support for venue organizers.
 * Queries are enriched with live venue statistics before prompting.
 */
import { Router } from "express";
import { CrowdZone } from "../models/CrowdZone.js";
import { Alert } from "../models/Alert.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { QueryDecisionSupportBody } from "../utils/validation.js";
import { queryDecision } from "../services/geminiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/**
 * POST /query — Submit a natural-language operational query.
 * Aggregates live zone/alert data and forwards to the AI model.
 */
router.post(
  "/query",
  authenticate,
  authorize("admin", "organizer", "staff"),
  asyncHandler(async (req, res) => {
    const parsed = QueryDecisionSupportBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const [zones, alerts] = await Promise.all([
      CrowdZone.find(),
      Alert.find({ status: "active" }),
    ]);

    const totalAttendees = zones.reduce((sum, z) => sum + z.count, 0);
    const zonesAtCapacity = zones.filter(
      (z) => z.level === "high" || z.level === "critical"
    ).length;

    const result = await queryDecision({
      query: parsed.data.query,
      context: parsed.data.context || "",
      venueStats: {
        totalAttendees,
        activeAlerts: alerts.length,
        zonesAtCapacity,
      },
    });

    res.json(result);
  })
);

export default router;
