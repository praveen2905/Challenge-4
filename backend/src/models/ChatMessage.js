import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  role: { type: String, enum: ["user", "assistant"], required: true },
  content: { type: String, required: true },
  language: { type: String, default: "en" },
  timestamp: { type: Date, default: Date.now },
});

chatMessageSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
