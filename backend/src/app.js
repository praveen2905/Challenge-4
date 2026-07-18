import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";

const app = express();

// Trust proxy for accurate IP-based rate limiting behind Vercel/load balancer
app.set("trust proxy", 1);

// Security headers
app.use(
  helmet({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
  })
);

// CORS
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? (process.env.ALLOWED_ORIGINS || "").split(",").map(o => o.trim()).filter(Boolean)
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);

// Global rate limit: 200 req / 15 min per IP
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests",
      message: "Rate limit exceeded. Please try again later.",
    },
  })
);

// AI endpoint rate limit: 30 req / 15 min per IP
const aiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "AI rate limit exceeded",
    message: "Too many AI requests. Please wait before trying again.",
  },
});

// Auth endpoint rate limit: 20 req / 15 min per IP to prevent login brute-forcing & registration spam
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts",
    message: "Rate limit exceeded. Please try again after 15 minutes.",
  },
});

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Apply AI rate limit to AI-heavy endpoints
app.use("/api/crowd/analyze", aiRateLimit);
app.use("/api/navigation/route", aiRateLimit);
app.use("/api/chat/message", aiRateLimit);
app.use("/api/decisions/query", aiRateLimit);

// Apply auth rate limit to login/register
app.use("/api/auth/register", authRateLimit);
app.use("/api/auth/login", authRateLimit);

app.use("/api", router);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  const statusCode = err.status || err.statusCode || 500;
  const isProduction = process.env.NODE_ENV === "production";
  const message = (statusCode === 500 && isProduction)
    ? "An unexpected error occurred on the server."
    : err.message;
  res.status(statusCode).json({ error: statusCode === 500 ? "Internal server error" : "Error", message });
});

// 404 catch-all for unmatched routes
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found", message: "The requested resource does not exist." });
});

export default app;
