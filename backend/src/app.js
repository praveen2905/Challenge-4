import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import router from "./routes/index.js";

const app = express();

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
        ? (process.env.ALLOWED_ORIGINS || "").split(",").filter(Boolean)
        : true,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// Apply AI rate limit to AI-heavy endpoints
app.use("/api/crowd/analyze", aiRateLimit);
app.use("/api/navigation/route", aiRateLimit);
app.use("/api/chat/message", aiRateLimit);
app.use("/api/decisions/query", aiRateLimit);

app.use("/api", router);

// Global error handler
app.use((err, _req, res, _next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;
