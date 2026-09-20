import mongoose from "mongoose";
import { QUEST_CATEGORIES } from "../game-engine/badges.js";
import { DIFFICULTIES } from "../game-engine/economy.js";
import { ATTRIBUTES, REPEATS } from "../game-engine/constants.js";

const questSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 100 },
    category: { type: String, enum: QUEST_CATEGORIES, default: "General" },
    attribute: { type: String, enum: ATTRIBUTES, default: "Discipline" },
    difficulty: { type: String, enum: Object.keys(DIFFICULTIES), default: "Normal" },
    // Reward is fixed when the quest is created, from the difficulty table.
    xp: { type: Number, required: true },
    gold: { type: Number, required: true },
    repeat: { type: String, enum: REPEATS, default: "One-time" },
    dueDate: { type: String, default: null }, // "YYYY-MM-DD", one-time quests only
    done: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
    completedDay: { type: String, default: null }, // day key of completedAt, used to reset repeating quests
  },
  { timestamps: true }
);

questSchema.index({ userId: 1, done: 1 });

export default mongoose.model("Quest", questSchema);
