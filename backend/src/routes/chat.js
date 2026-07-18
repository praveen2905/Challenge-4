/**
 * Chat Routes
 *
 * Provides multilingual AI chat with conversation history persistence.
 * Messages are stored per-user and limited to the most recent exchanges.
 */
import { Router } from "express";
import { ChatMessage } from "../models/ChatMessage.js";
import { Venue } from "../models/Venue.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate } from "../middlewares/authenticate.js";
import { SendChatMessageBody } from "../utils/validation.js";
import { chat } from "../services/geminiService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

/** GET /history — Retrieve the authenticated user's chat history. */
router.get(
  "/history",
  authenticate,
  asyncHandler(async (req, res) => {
    const messages = await ChatMessage.find({ userId: req.user.id })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages.map((m) => m.toJSON()));
  })
);

/** DELETE /history — Clear the authenticated user's chat history. */
router.delete(
  "/history",
  authenticate,
  asyncHandler(async (req, res) => {
    await ChatMessage.deleteMany({ userId: req.user.id });
    res.json({ message: "Chat history cleared" });
  })
);

/**
 * POST /message — Send a message to the AI assistant.
 * Persists both user and assistant messages, includes venue context.
 */
router.post(
  "/message",
  authenticate,
  asyncHandler(async (req, res) => {
    const parsed = SendChatMessageBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const { message, language } = parsed.data;
    const userId = req.user.id;

    // Build conversation context from recent history
    const history = await ChatMessage.find({ userId })
      .sort({ timestamp: 1 })
      .limit(20);
    const chatHistory = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Fetch venue context for grounding the AI response
    const venues = await Venue.find().limit(1);
    const venue = venues[0];
    const venueContext = venue
      ? `Venue: ${venue.name}, Capacity: ${venue.totalCapacity}, Amenities: ${venue.amenities.join(", ")}`
      : "Multi-venue tournament facility with food, medical, and accessibility services";

    const result = await chat({
      message,
      history: chatHistory,
      language: language || "en",
      venueContext,
    });

    // Persist both sides of the conversation
    const userMsg = await ChatMessage.create({
      userId,
      role: "user",
      content: message,
      language: result.detectedLanguage,
    });

    const assistantMsg = await ChatMessage.create({
      userId,
      role: "assistant",
      content: result.reply,
      language: result.detectedLanguage,
    });

    // Log new chat sessions for activity tracking
    if (history.length === 0) {
      await ActivityLog.create({
        type: "chat_session",
        message: `New AI chat session started (${result.detectedLanguage})`,
        userId,
      });
    }

    res.json({
      reply: result.reply,
      detectedLanguage: result.detectedLanguage,
      userMessage: userMsg.toJSON(),
      assistantMessage: assistantMsg.toJSON(),
      aiPowered: result.aiPowered,
    });
  })
);

export default router;
