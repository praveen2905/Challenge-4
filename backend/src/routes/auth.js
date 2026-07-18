/**
 * Authentication Routes
 *
 * Handles user registration, login, profile retrieval, and logout.
 * Passwords are hashed via bcrypt in the User model pre-save hook.
 */
import { Router } from "express";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate, generateToken } from "../middlewares/authenticate.js";
import { RegisterUserBody, LoginUserBody } from "../utils/validation.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/** POST /register — Create a new user account and return a JWT. */
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const parsed = RegisterUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }
    const { name, email, password, role, language } = parsed.data;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || "fan",
      language: language || "en",
    });
    const token = generateToken(
      user._id.toString(),
      user.email,
      user.role,
      user.name
    );

    await ActivityLog.create({
      type: "user_joined",
      message: `${name} joined as ${role || "fan"}`,
    });

    res.status(201).json({ token, user: user.toJSON() });
  })
);

/** POST /login — Authenticate with email/password and return a JWT. */
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const parsed = LoginUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = generateToken(
      user._id.toString(),
      user.email,
      user.role,
      user.name
    );
    res.json({ token, user: user.toJSON() });
  })
);

/** GET /me — Return the currently authenticated user's profile. */
router.get(
  "/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.toJSON());
  })
);

/** POST /logout — Stateless logout acknowledgement (JWT is client-side). */
router.post("/logout", authenticate, (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
