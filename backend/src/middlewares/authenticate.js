import jwt from "jsonwebtoken";
import { User } from "../models/User.js";

const JWT_SECRET = process.env.SESSION_SECRET || "venueiq_super_secret_session_key";
if (process.env.NODE_ENV === "production" && JWT_SECRET === "venueiq_super_secret_session_key") {
  console.warn("⚠️ SECURITY WARNING: Using fallback JWT secret in production! Please define SESSION_SECRET.");
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";

export function generateToken(userId, email, role, name) {
  return jwt.sign({ id: userId, email, role, name }, JWT_SECRET, {
    expiresIn: JWT_EXPIRY,
  });
}

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized", message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({ error: "Unauthorized", message: "User not found" });
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, name: decoded.name };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized", message: "Invalid or expired token" });
  }
}
