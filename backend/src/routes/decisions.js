import { Router } from "express";
import { CrowdZone } from "../models/CrowdZone.js";
import { Alert } from "../models/Alert.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { QueryDecisionSupportBody } from "../utils/validation.js";
import { queryDecision } from "../services/geminiService.js";

const router = Router();

router.post(
  "/query",
  authenticate,
  authorize("admin", "organizer", "staff"),
  async (req, res) => {
    try {
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
    } catch (err) {
      res.status(500).json({ error: "Server error", message: err.message });
    }
  }
);

export default router;
