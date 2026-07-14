import mongoose from "mongoose";

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "overcrowding",
        "fire_hazard",
        "medical",
        "security",
        "evacuation",
        "info",
      ],
      required: true,
    },
    zone: { type: String, required: true },
    severity: {
      type: String,
      enum: ["info", "warning", "critical"],
      required: true,
    },
    message: { type: String, required: true },
    status: { type: String, enum: ["active", "resolved"], default: "active" },
    createdBy: { type: String, default: null },
    resolvedBy: { type: String, default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

alertSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Alert = mongoose.model("Alert", alertSchema);
