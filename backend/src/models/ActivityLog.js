import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: [
      "alert_created",
      "alert_resolved",
      "zone_updated",
      "user_joined",
      "navigation_request",
      "chat_session",
    ],
    required: true,
  },
  message: { type: String, required: true },
  zone: { type: String, default: null },
  severity: { type: String, default: null },
  userId: { type: String, default: null },
  timestamp: { type: Date, default: Date.now, index: true },
});

// Indexes for performance
activityLogSchema.index({ timestamp: -1 });
activityLogSchema.index({ type: 1 });

activityLogSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
