import mongoose from "mongoose";

const num = (def = 0) => ({ type: Number, default: def, min: 0 });

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },

    // Progress. A new player starts at level 1 with nothing.
    level: { type: Number, default: 1, min: 1 },
    xp: num(),
    gold: num(),

    // Streak. `streak` only changes on completion; "is it still alive today?" is
    // worked out from lastCompletedDate (see game-engine/streak.js).
    streak: num(),
    longestStreak: num(),
    lastCompletedDate: { type: String, default: null }, // "YYYY-MM-DD" in the player's timezone
    totalDone: num(),

    attrs: {
      Strength: num(),
      Intellect: num(),
      Discipline: num(),
      Charisma: num(),
    },
    catDone: {
      Food: num(),
      Fitness: num(),
      Study: num(),
      Sleep: num(),
      General: num(),
    },

    ownedFrames: { type: [String], default: [] },
    equippedFrame: { type: String, default: null },
    unlockedBadges: {
      type: [new mongoose.Schema({ badgeId: String, unlockedAt: Date }, { _id: false })],
      default: [],
    },

    settings: {
      reminders: { type: Boolean, default: true },
      streakAlerts: { type: Boolean, default: true },
      sounds: { type: Boolean, default: false },
    },

    // IANA name like "Asia/Kolkata". Decides where midnight is for streaks and "today".
    timezone: { type: String, default: "UTC" },
  },
  {
    timestamps: true,
    // Two requests changing the same player at once (say, completing two quests) must
    // not overwrite each other. A stale save throws a VersionError and we retry.
    optimisticConcurrency: true,
  }
);

export default mongoose.model("User", userSchema);
