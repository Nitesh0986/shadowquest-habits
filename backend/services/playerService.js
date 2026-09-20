import mongoose from "mongoose";
import User from "../models/User.js";
import Activity from "../models/Activity.js";
import AppError from "../utils/AppError.js";
import { evaluateBadges } from "../game-engine/badges.js";
import { playerDTO } from "../utils/serialize.js";
import { addDays, dayKey } from "../utils/dates.js";

// Load the player, let `mutator` change them, save. If someone else changed the same
// player in between (two requests at once), the save fails with a VersionError and we
// simply try again on fresh data. `mutator` may run more than once, so it must only
// touch the user document it is given.
export async function updateUser(userId, mutator, attempts = 5) {
  for (let i = 1; ; i++) {
    const user = await User.findById(userId);
    if (!user) throw new AppError(404, "Player not found.", "NOT_FOUND");

    const result = await mutator(user);
    try {
      await user.save();
      return { user, result };
    } catch (err) {
      if (err.name === "VersionError" && i < attempts) continue;
      throw err;
    }
  }
}

// Unlock any badge the player now qualifies for and record it on the user.
// Returns the newly unlocked badges (with live progress).
export function grantBadges(user, now = new Date()) {
  const plain = user.toObject();
  const have = new Set(user.unlockedBadges.map((b) => b.badgeId));
  const fresh = evaluateBadges(plain, plain.ownedFrames).filter((b) => b.unlocked && !have.has(b.id));
  fresh.forEach((b) => user.unlockedBadges.push({ badgeId: b.id, unlockedAt: now }));
  return fresh;
}

// Insert activity rows. createdAt is nudged 1ms apart so a quest, its level-up and its
// badges always sort in the order they happened.
export async function logActivities(userId, tz, entries, now = new Date()) {
  if (!entries.length) return;
  const day = dayKey(now, tz);
  await Activity.insertMany(
    entries.map((e, i) => ({
      userId,
      type: e.type,
      title: e.title,
      reward: e.reward ?? "—",
      day,
      createdAt: new Date(now.getTime() + i),
    }))
  );
}

// { "2026-09-19": 3, "2026-09-20": 1 } quests finished per day, inclusive range.
export async function getDailyCounts(userId, fromKey, toKey) {
  const rows = await Activity.aggregate([
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId),
        type: "quest",
        day: { $gte: fromKey, $lte: toKey },
      },
    },
    { $group: { _id: "$day", count: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.count]));
}

// The full player object the frontend expects, including this week's total.
export async function buildPlayer(user, now = new Date()) {
  const today = dayKey(now, user.timezone);
  const counts = await getDailyCounts(user._id, addDays(today, -6), addDays(today, -1));
  const weekDone = Object.values(counts).reduce((a, b) => a + b, 0);
  return playerDTO(user, { weekDone, now });
}
