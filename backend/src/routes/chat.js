import { Router } from "express";
import { ChatMessage } from "../models/ChatMessage.js";
import { Venue } from "../models/Venue.js";
import { ActivityLog } from "../models/ActivityLog.js";
import { authenticate } from "../middlewares/authenticate.js";
import { SendChatMessageBody } from "../utils/validation.js";
import { chat } from "../services/geminiService.js";

const router = Router();

router.get("/history", authenticate, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user.id })
      .sort({ timestamp: 1 })
      .limit(100);
    res.json(messages.map((m) => m.toJSON()));
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.delete("/history", authenticate, async (req, res) => {
  try {
    await ChatMessage.deleteMany({ userId: req.user.id });
    res.json({ message: "Chat history cleared" });
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

router.post("/message", authenticate, async (req, res) => {
  try {
    const parsed = SendChatMessageBody.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation error", message: parsed.error.message });
    }

    const { message, language } = parsed.data;
    const userId = req.user.id;

    const history = await ChatMessage.find({ userId })
      .sort({ timestamp: 1 })
      .limit(20);
    const chatHistory = history.map((m) => ({
      role: m.role,
      content: m.content,
    }));

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
  } catch (err) {
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

export default router;
