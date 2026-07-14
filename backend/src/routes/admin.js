import { Router } from "express";
import { User } from "../models/User.js";
import { Venue } from "../models/Venue.js";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { UpdateUserBody, CreateVenueBody } from "../utils/validation.js";

const router = Router();

router.get("/users", authenticate, authorize("admin"), async (_req, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users.map((u) => u.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.patch(
  "/users/:userId",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const parsed = UpdateUserBody.safeParse(req.body);
      if (!parsed.success) {
        return res
          .status(400)
          .json({ error: "Validation error", message: parsed.error.message });
      }

      const user = await User.findByIdAndUpdate(
        req.params.userId,
        { $set: parsed.data },
        { new: true, runValidators: true }
      );
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user.toJSON());
    } catch (err) {
      res.status(500).json({ error: "Server error", message: err.message });
    }
  }
);

router.delete(
  "/users/:userId",
  authenticate,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findByIdAndDelete(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ error: "Server error", message: err.message });
    }
  }
);

router.post(
  "/venues",
  authenticate,
  authorize("admin"),
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
