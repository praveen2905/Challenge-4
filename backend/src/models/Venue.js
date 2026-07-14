import mongoose from "mongoose";

const venueZoneSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    capacity: { type: Number, required: true },
    type: { type: String, required: true },
  },
  { _id: false }
);

const venueSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    totalCapacity: { type: Number, required: true },
    zones: [venueZoneSchema],
    amenities: [String],
    address: { type: String, required: true },
  },
  { timestamps: true }
);

venueSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export const Venue = mongoose.model("Venue", venueSchema);
