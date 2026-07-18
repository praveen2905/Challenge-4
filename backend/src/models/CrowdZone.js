import mongoose from "mongoose";

const crowdZoneSchema = new mongoose.Schema({
  zoneId: { type: String, required: true },
  name: { type: String, required: true },
  count: { type: Number, required: true, min: 0, default: 0 },
  capacity: { type: Number, required: true },
  densityPercent: { type: Number, default: 0 },
  level: {
    type: String,
    enum: ["low", "medium", "high", "critical"],
    default: "low",
  },
  venueId: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
});

// Indexes for performance
crowdZoneSchema.index({ zoneId: 1 }, { unique: true });
crowdZoneSchema.index({ venueId: 1 });

function computeLevel(densityPercent) {
  if (densityPercent < 50) return "low";
  if (densityPercent < 70) return "medium";
  if (densityPercent < 90) return "high";
  return "critical";
}

crowdZoneSchema.pre("save", function (next) {
  this.densityPercent = this.capacity > 0 ? Math.round((this.count / this.capacity) * 100) : 0;
  this.level = computeLevel(this.densityPercent);
  this.lastUpdated = new Date();
  next();
});

crowdZoneSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const CrowdZone = mongoose.model("CrowdZone", crowdZoneSchema);
