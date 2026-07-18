/**
 * Venues Routes
 *
 * CRUD operations for venue entities. Read endpoints are available to all
 * authenticated users; creation is restricted to admin/organizer roles.
 */
import { Router } from "express";
import { Venue } from "../models/Venue.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { CreateVenueBody } from "../utils/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/** GET / — List all venues, newest first. */
router.get(
  "/",
  authenticate,
  asyncHandler(async (_req, res) => {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.json(venues.map((v) => v.toJSON()));
  })
);

/** GET /:venueId — Retrieve a single venue by ID. */
router.get(
  "/:venueId",
  authenticate,
  asyncHandler(async (req, res) => {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.json(venue.toJSON());
  })
);

/**
 * Shared handler for venue creation — used by both /venues and /admin/venues.
 * Validates input via Zod schema before persisting.
 */
export const createVenueHandler = asyncHandler(async (req, res) => {
  const parsed = CreateVenueBody.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "Validation error", message: parsed.error.message });
  }
  const venue = await Venue.create(parsed.data);
  res.status(201).json(venue.toJSON());
});

/** POST / — Create a new venue (admin/organizer only). */
router.post("/", authenticate, authorize("admin", "organizer"), createVenueHandler);

export default router;
