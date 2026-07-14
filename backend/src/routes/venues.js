import { Router } from "express";
import { Venue } from "../models/Venue.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { CreateVenueBody } from "../utils/validation.js";

const router = Router();

router.get("/", authenticate, async (_req, res) => {
  try {
    const venues = await Venue.find().sort({ createdAt: -1 });
    res.json(venues.map((v) => v.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/:venueId", authenticate, async (req, res) => {
  try {
    const venue = await Venue.findById(req.params.venueId);
    if (!venue) {
      return res.status(404).json({ error: "Venue not found" });
    }
    res.json(venue.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post(
  "/",
  authenticate,
  authorize("admin", "organizer"),
  async (req, res) => {
    try {
      const parsed = CreateVenueBody.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation error", message: parsed.error.message });
      }
      const venue = await Venue.create(parsed.data);
      res.status(201).json(venue.toJSON());
    } catch (err) {
      res.status(500).json({ error: "Server error", message: err.message });
    }
  }
);

export default router;
