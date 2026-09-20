import mongoose from "mongoose";

// One row per thing that happened. Also the source of the weekly chart:
// every completed quest writes a "quest" row, so history survives even when a
// repeating quest is reset for the next day.
const activitySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, enum: ["quest", "levelup", "badge", "purchase"], required: true },
    title: { type: String, required: true },
    reward: { type: String, default: "—" }, // "+30 XP", "-40g", "—"
    day: { type: String, required: true }, // "YYYY-MM-DD" in the player's timezone at the time
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, type: 1, day: 1 });

export default mongoose.model("Activity", activitySchema);
