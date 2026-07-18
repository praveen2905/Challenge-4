/**
 * Crowd Management Routes
 *
 * Provides zone monitoring, alert management, and AI-powered crowd analysis.
 * Auto-creates alerts when zones transition to critical/high density.
 */
import { Router } from "express";
import { CrowdZone } from "../models/CrowdZone.js";
import { Alert } from "../models/Alert.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { UpdateZoneCountBody, AnalyzeCrowdBody } from "../utils/validation.js";
import { analyzeCrowd } from "../services/geminiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/** GET /zones — List all crowd zones sorted by ID. */
router.get(
  "/zones",
  authenticate,
  asyncHandler(async (_req, res) => {
    const zones = await CrowdZone.find().sort({ zoneId: 1 });
    res.json(zones.map((z) => z.toJSON()));
  })
);

/**
 * PUT /zones/:zoneId/update — Update the headcount for a zone.
 * Automatically creates alerts when a zone transitions to critical or high.
 */
router.put(
  "/zones/:zoneId/update",
  authenticate,
  authorize("admin", "organizer", "staff"),
  asyncHandler(async (req, res) => {
    const parsed = UpdateZoneCountBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const zone = await CrowdZone.findOne({ zoneId: req.params.zoneId });
    if (!zone) {
      return res.status(404).json({ error: "Zone not found" });
    }

    const prevLevel = zone.level;
    zone.count = parsed.data.count;
    await zone.save();

    await ActivityLog.create({
      type: "zone_updated",
      message: `${zone.name} updated to ${parsed.data.count}/${zone.capacity} (${zone.densityPercent}%)`,
      zone: zone.zoneId,
      userId: req.user.id,
    });

    // Auto-create alert on transition to critical
    if (prevLevel !== "critical" && zone.level === "critical") {
      await Alert.create({
        type: "overcrowding",
        zone: zone.zoneId,
        severity: "critical",
        message: `${zone.name} has reached critical capacity (${zone.densityPercent}%). Immediate action required.`,
        createdBy: req.user.id,
      });
      await ActivityLog.create({
        type: "alert_created",
        message: `Auto-alert: ${zone.name} at critical capacity`,
        zone: zone.zoneId,
        severity: "critical",
      });
    } else if (
      prevLevel !== "high" &&
      prevLevel !== "critical" &&
      zone.level === "high"
    ) {
      await Alert.create({
        type: "overcrowding",
        zone: zone.zoneId,
        severity: "warning",
        message: `${zone.name} is at high density (${zone.densityPercent}%). Consider crowd management measures.`,
        createdBy: req.user.id,
      });
    }

    res.json(zone.toJSON());
  })
);

/** GET /alerts — List the 50 most recent alerts. */
router.get(
  "/alerts",
  authenticate,
  asyncHandler(async (_req, res) => {
    const alerts = await Alert.find().sort({ createdAt: -1 }).limit(50);
    res.json(alerts.map((a) => a.toJSON()));
  })
);

/** POST /alerts/:alertId/resolve — Mark an alert as resolved. */
router.post(
  "/alerts/:alertId/resolve",
  authenticate,
  authorize("admin", "organizer", "staff"),
  asyncHandler(async (req, res) => {
    const alert = await Alert.findById(req.params.alertId);
    if (!alert) {
      return res.status(404).json({ error: "Alert not found" });
    }

    alert.status = "resolved";
    alert.resolvedBy = req.user.id;
    alert.resolvedAt = new Date();
    await alert.save();

    await ActivityLog.create({
      type: "alert_resolved",
      message: `Alert resolved in ${alert.zone}: ${alert.message.slice(0, 60)}...`,
      zone: alert.zone,
      severity: alert.severity,
      userId: req.user.id,
    });

    res.json(alert.toJSON());
  })
);

/** POST /analyze — Run AI-powered crowd analysis on a venue's zones. */
router.post(
  "/analyze",
  authenticate,
  authorize("admin", "organizer", "staff"),
  asyncHandler(async (req, res) => {
    const parsed = AnalyzeCrowdBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const zones = await CrowdZone.find({ venueId: parsed.data.venueId });
    const zoneData = zones.map((z) => ({
      name: z.name,
      densityPercent: z.densityPercent,
      level: z.level,
      count: z.count,
      capacity: z.capacity,
    }));

    const result = await analyzeCrowd({
      zones: zoneData,
      context: parsed.data.context,
    });
    res.json(result);
  })
);

export default router;
