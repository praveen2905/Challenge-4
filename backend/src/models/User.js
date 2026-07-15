import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: {
      type: String,
      enum: ["fan", "volunteer", "organizer", "staff", "admin"],
      default: "fan",
    },
    language: { type: String, default: "en", maxlength: 10 },
    assignedZone: { type: String, default: null },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 14);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  const user = await User.findById(this._id).select("+password");
  if (!user) return false;
  return bcrypt.compare(candidate, user.password);
};

// Ensure password is never leaked via toJSON
userSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id?.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.password;
    return ret;
  },
});

export const User = mongoose.model("User", userSchema);
