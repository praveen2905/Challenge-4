import { Router } from "express";
import { User } from "../models/User.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate, generateToken } from "../middlewares/authenticate.js";
import { RegisterUserBody, LoginUserBody } from "../utils/validation.js";

const router = Router();

router.post("/register", async (req, res) => {
  try {
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
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const parsed = LoginUserBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }
    const { email, password } = parsed.data;

    const user = await User.findOne({ email });
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
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.get("/me", authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user.toJSON());
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/logout", authenticate, (_req, res) => {
  res.json({ message: "Logged out successfully" });
});

export default router;
