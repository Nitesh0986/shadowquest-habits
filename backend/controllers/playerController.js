import User from "../models/User.js";
import Quest from "../models/Quest.js";
import Activity from "../models/Activity.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { addDays, dayKey, dayName, isValidTimezone } from "../utils/dates.js";
import { buildPlayer, getDailyCounts, updateUser } from "../services/playerService.js";
import { cleanEmail, cleanName } from "./authController.js";

const SETTING_KEYS = ["reminders", "streakAlerts", "sounds"];

// GET /api/player
export const getPlayer = asyncHandler(async (req, res) => {
  res.json({ player: await buildPlayer(req.user) });
});

// PATCH /api/player   { name?, email?, timezone?, settings?: { reminders?, streakAlerts?, sounds? } }
export const updatePlayer = asyncHandler(async (req, res) => {
  const { name, email, timezone, settings } = req.body ?? {};
  if ([name, email, timezone, settings].every((v) => v === undefined)) {
    throw new AppError(400, "Nothing to update.", "VALIDATION_ERROR");
  }

  const changes = {};
  if (name !== undefined) changes.name = cleanName(name);
  if (email !== undefined) {
    changes.email = cleanEmail(email);
    if (await User.exists({ email: changes.email, _id: { $ne: req.user._id } })) {
      throw new AppError(409, "An account with this email already exists.", "EMAIL_TAKEN");
    }
  }
  if (timezone !== undefined) {
    if (!isValidTimezone(timezone)) throw new AppError(400, "That isn't a valid timezone.", "VALIDATION_ERROR");
    changes.timezone = timezone;
  }
  if (settings !== undefined) {
    if (typeof settings !== "object" || settings === null || Array.isArray(settings)) {
      throw new AppError(400, "Settings must be an object.", "VALIDATION_ERROR");
    }
    for (const [key, value] of Object.entries(settings)) {
      if (!SETTING_KEYS.includes(key)) throw new AppError(400, `Unknown setting "${key}".`, "VALIDATION_ERROR");
      if (typeof value !== "boolean") throw new AppError(400, `Setting "${key}" must be true or false.`, "VALIDATION_ERROR");
    }
  }

  let user;
  try {
    ({ user } = await updateUser(req.user._id, (u) => {
      u.set(changes);
      if (settings) Object.entries(settings).forEach(([key, value]) => u.set(`settings.${key}`, value));
    }));
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, "An account with this email already exists.", "EMAIL_TAKEN");
    throw err;
  }

  res.json({ player: await buildPlayer(user) });
});

// DELETE /api/player   removes the character and everything that belongs to it
export const deletePlayer = asyncHandler(async (req, res) => {
  await Promise.all([
    Quest.deleteMany({ userId: req.user._id }),
    Activity.deleteMany({ userId: req.user._id }),
  ]);
  await User.deleteOne({ _id: req.user._id });
  res.json({ message: "Account deleted." });
});

// GET /api/player/week
// The six days before today (oldest first) plus today, as bar heights.
// Same scale the dashboard uses: each quest is worth 20%, capped at 100%.
export const getWeek = asyncHandler(async (req, res) => {
  const tz = req.user.timezone;
  const today = dayKey(new Date(), tz);
  const counts = await getDailyCounts(req.user._id, addDays(today, -6), today);
  const bar = (key, label) => {
    const count = counts[key] ?? 0;
    return { day: label, date: key, count, value: Math.min(100, count * 20) };
  };

  const bars = [-6, -5, -4, -3, -2, -1].map((i) => {
    const key = addDays(today, i);
    return bar(key, dayName(key));
  });
  const todayBar = bar(today, "Today");
  const weekDone = bars.reduce((sum, b) => sum + b.count, 0);

  res.json({ bars, today: todayBar, weekDone, total: weekDone + todayBar.count });
});
