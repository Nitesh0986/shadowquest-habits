// Creates (or resets) a demo player so you can log in and click around straight away.
//   npm run seed        ->  demo@shadowquest.test / password123
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env, assertEnv } from "../config/env.js";
import User from "../models/User.js";
import Quest from "../models/Quest.js";
import Activity from "../models/Activity.js";
import { rewardFor } from "../game-engine/economy.js";
import { addDays, dayKey } from "../utils/dates.js";

assertEnv();
await mongoose.connect(env.mongoUri);

const EMAIL = "demo@shadowquest.test";
const old = await User.findOne({ email: EMAIL });
if (old) {
  await Promise.all([Quest.deleteMany({ userId: old._id }), Activity.deleteMany({ userId: old._id })]);
  await old.deleteOne();
}

const user = await User.create({
  name: "Aris Hollow",
  email: EMAIL,
  passwordHash: await bcrypt.hash("password123", 10),
  timezone: env.defaultTimezone,
  gold: 46,
});

const today = dayKey(new Date(), user.timezone);
const quests = [
  ["Eat a proper breakfast", "Food", "Discipline", "Easy", "Daily"],
  ["Finish chapter 4 of Deep Work", "Study", "Intellect", "Normal", "Daily"],
  ["Leg day: squats & lunges", "Fitness", "Strength", "Hard", "Weekly"],
  ["Lights out by 11pm", "Sleep", "Discipline", "Normal", "Daily"],
  ["Call mum", "General", "Charisma", "Easy", "One-time"],
  ["Submit tax documents", "General", "Discipline", "Hard", "One-time", addDays(today, -1)],
].map(([title, category, attribute, difficulty, repeat, dueDate = null]) => ({
  userId: user._id,
  title,
  category,
  attribute,
  difficulty,
  repeat,
  dueDate,
  ...rewardFor(difficulty),
}));
await Quest.insertMany(quests);

console.log(`Seeded ${EMAIL} / password123 with ${quests.length} quests (one of them overdue).`);
await mongoose.disconnect();
