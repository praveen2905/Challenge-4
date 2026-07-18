/**
 * Dashboard Routes
 *
 * Aggregated statistics, activity feed, and crowd trend data for the
 * operations dashboard. All endpoints require authentication.
 */
import { Router } from "express";
import { User } from "../models/User.js";
import { CrowdZone } from "../models/CrowdZone.js";
import { Alert } from "../models/Alert.js";
import { ChatMessage } from "../models/ChatMessage.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate } from "../middlewares/authenticate.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/** GET /stats — Aggregate venue-wide operational statistics. */
router.get(
  "/stats",
  authenticate,
  asyncHandler(async (_req, res) => {
    const [zones, alerts, volunteers, chatSessions] = await Promise.all([
      CrowdZone.find({}, "zoneId count capacity level densityPercent"),
      Alert.find({ status: "active" }, "id status severity"),
      User.countDocuments({ role: "volunteer" }),
      ChatMessage.distinct("userId"),
    ]);

    const totalAttendees = zones.reduce((sum, z) => sum + z.count, 0);
    const zonesAtCapacity = zones.filter(
      (z) => z.level === "high" || z.level === "critical"
    ).length;
    const avgDensity = zones.length
      ? Math.round(
          zones.reduce((sum, z) => sum + z.densityPercent, 0) / zones.length
        )
      : 0;
    const resolvedAlerts = await Alert.countDocuments({ status: "resolved" });

    res.json({
      totalAttendees,
      activeAlerts: alerts.length,
      zonesAtCapacity,
      avgDensity,
      totalZones: zones.length,
      resolvedAlerts,
      activeVolunteers: volunteers,
      chatSessions: chatSessions.length,
    });
  })
);

/** GET /activity — Return the 20 most recent activity log entries. */
router.get(
  "/activity",
  authenticate,
  asyncHandler(async (_req, res) => {
    const activities = await ActivityLog.find(
      {},
      "type message zone severity timestamp"
    )
      .sort({ timestamp: -1 })
      .limit(20);
    res.json(activities.map((a) => a.toJSON()));
  })
);

/**
 * GET /crowd-trend — Generate a simulated time-series crowd trend.
 * Uses current zone data as the baseline and projects backwards.
 */
router.get(
  "/crowd-trend",
  authenticate,
  asyncHandler(async (_req, res) => {
    const zones = await CrowdZone.find();
    const totalCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
    const currentCount = zones.reduce((sum, z) => sum + z.count, 0);
    const activeAlerts = await Alert.countDocuments({ status: "active" });

    const now = Date.now();
    const trend = Array.from({ length: 9 }, (_, i) => {
      const hourOffset = 8 - i;
      const time = new Date(now - hourOffset * 3600000);
      const factor = 0.3 + (i / 8) * 0.85;
      const noise = 0.9 + Math.random() * 0.2;
      const count = Math.round(currentCount * factor * noise);
      const avgDensity =
        totalCapacity > 0 ? Math.round((count / totalCapacity) * 100) : 0;
      return {
        time: time.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        }),
        totalCount: count,
        avgDensity,
        activeAlerts: i < 6 ? 0 : Math.min(i - 5, activeAlerts),
      };
    });

    // Snap the last data point to current real values
    const last = trend[trend.length - 1];
    last.totalCount = currentCount;
    last.avgDensity =
      totalCapacity > 0 ? Math.round((currentCount / totalCapacity) * 100) : 0;
    last.activeAlerts = activeAlerts;

    res.json(trend);
  })
);

export default router;
