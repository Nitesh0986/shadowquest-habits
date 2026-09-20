import Quest from "../models/Quest.js";
import AppError from "../utils/AppError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { addXp } from "../game-engine/xpCurve.js";
import { DIFFICULTIES, rewardFor } from "../game-engine/economy.js";
import { CATEGORY_ATTRIBUTE, QUEST_CATEGORIES } from "../game-engine/badges.js";
import { applyCompletion } from "../game-engine/streak.js";
import { ATTRIBUTES, normalizeRepeat } from "../game-engine/constants.js";
import { dayKey, isDayKey, weekStart } from "../utils/dates.js";
import { activityDTO, badgeDTO, questDTO } from "../utils/serialize.js";
import { buildPlayer, grantBadges, logActivities, updateUser } from "../services/playerService.js";

const MAX_QUESTS_PER_PLAYER = 200;

const bad = (message) => new AppError(400, message, "VALIDATION_ERROR");

// ---------- validation ----------
function cleanTitle(value) {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title) throw bad("Give your quest a name.");
  if (title.length > 100) throw bad("Quest names can be at most 100 characters.");
  return title;
}

function cleanCategory(value) {
  if (!QUEST_CATEGORIES.includes(value)) throw bad(`Category must be one of: ${QUEST_CATEGORIES.join(", ")}.`);
  return value;
}

function cleanAttribute(value) {
  if (!ATTRIBUTES.includes(value)) throw bad(`Attribute must be one of: ${ATTRIBUTES.join(", ")}.`);
  return value;
}

function cleanDifficulty(value) {
  if (!Object.hasOwn(DIFFICULTIES, value)) throw bad(`Difficulty must be one of: ${Object.keys(DIFFICULTIES).join(", ")}.`);
  return value;
}

function cleanRepeat(value) {
  const repeat = normalizeRepeat(value);
  if (!repeat) throw bad("Repeat must be One-time, Daily or Weekly.");
  return repeat;
}

function cleanDueDate(value) {
  if (value === null || value === "") return null;
  if (!isDayKey(value)) throw bad("Due date must look like 2026-09-30.");
  return value;
}

// ---------- repeating quests ----------
// A finished daily quest comes back the next day, a weekly one on Monday.
// We do this lazily whenever quests are read, so no midnight job is needed.
async function refreshRepeating(userId, today) {
  const reset = { $set: { done: false, completedAt: null, completedDay: null } };
  await Quest.updateMany({ userId, repeat: "Daily", done: true, completedDay: { $lt: today } }, reset);
  await Quest.updateMany({ userId, repeat: "Weekly", done: true, completedDay: { $lt: weekStart(today) } }, reset);
}

// ---------- handlers ----------

// GET /api/quests?category=Food&status=active|done|overdue&scope=today
export const listQuests = asyncHandler(async (req, res) => {
  const { category, status, scope } = req.query;
  const tz = req.user.timezone;
  const now = new Date();

  if (category !== undefined) cleanCategory(category);
  if (status !== undefined && !["active", "done", "overdue"].includes(status)) {
    throw bad("Status must be active, done or overdue.");
  }

  await refreshRepeating(req.user._id, dayKey(now, tz));
  const docs = await Quest.find({ userId: req.user._id, ...(category && { category }) });

  let quests = docs.map((q) => questDTO(q, tz, now));
  if (status === "active") quests = quests.filter((q) => !q.done);
  if (status === "done") quests = quests.filter((q) => q.done);
  if (status === "overdue") quests = quests.filter((q) => q.overdue);
  if (scope === "today") quests = quests.filter((q) => q.dueToday);

  // Open quests first, overdue at the very top, newest first within each group.
  quests.sort(
    (a, b) =>
      Number(a.done) - Number(b.done) ||
      Number(b.overdue) - Number(a.overdue) ||
      new Date(b.createdAt) - new Date(a.createdAt)
  );

  res.json({ quests });
});

// POST /api/quests   { title, category, attribute, difficulty, repeat, dueDate? }
export const createQuest = asyncHandler(async (req, res) => {
  const body = req.body ?? {};
  const category = cleanCategory(body.category ?? "General");
  const difficulty = cleanDifficulty(body.difficulty ?? "Normal");
  const repeat = cleanRepeat(body.repeat ?? "One-time");
  const doc = {
    userId: req.user._id,
    title: cleanTitle(body.title),
    category,
    // Picking a category pre-selects the stat it usually trains, same as the form does.
    attribute: cleanAttribute(body.attribute ?? CATEGORY_ATTRIBUTE[category]),
    difficulty,
    repeat,
    dueDate: repeat === "One-time" ? cleanDueDate(body.dueDate ?? null) : null,
    ...rewardFor(difficulty),
  };

  if ((await Quest.countDocuments({ userId: req.user._id })) >= MAX_QUESTS_PER_PLAYER) {
    throw new AppError(400, `You can keep up to ${MAX_QUESTS_PER_PLAYER} quests. Delete some old ones first.`, "QUEST_LIMIT");
  }

  const quest = await Quest.create(doc);
  res.status(201).json({ quest: questDTO(quest, req.user.timezone) });
});

// PATCH /api/quests/:id   any of title, category, attribute, difficulty, repeat, dueDate
export const updateQuest = asyncHandler(async (req, res) => {
  const quest = await Quest.findOne({ _id: req.params.id, userId: req.user._id });
  if (!quest) throw new AppError(404, "Quest not found.", "NOT_FOUND");
  if (quest.done) throw new AppError(409, "A completed quest can't be edited.", "QUEST_DONE");

  const body = req.body ?? {};
  if (body.title !== undefined) quest.title = cleanTitle(body.title);
  if (body.category !== undefined) quest.category = cleanCategory(body.category);
  if (body.attribute !== undefined) quest.attribute = cleanAttribute(body.attribute);
  if (body.repeat !== undefined) quest.repeat = cleanRepeat(body.repeat);
  if (body.dueDate !== undefined) quest.dueDate = cleanDueDate(body.dueDate);
  if (body.difficulty !== undefined) {
    quest.difficulty = cleanDifficulty(body.difficulty);
    Object.assign(quest, rewardFor(quest.difficulty));
  }
  if (quest.repeat !== "One-time") quest.dueDate = null;

  await quest.save();
  res.json({ quest: questDTO(quest, req.user.timezone) });
});

// DELETE /api/quests/:id
export const deleteQuest = asyncHandler(async (req, res) => {
  const removed = await Quest.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!removed) throw new AppError(404, "Quest not found.", "NOT_FOUND");
  res.json({ id: String(removed._id) });
});

// POST /api/quests/:id/complete   <- the heart of the app
export const completeQuest = asyncHandler(async (req, res) => {
  const now = new Date();
  const tz = req.user.timezone;
  const today = dayKey(now, tz);

  await refreshRepeating(req.user._id, today);

  // 1 + 2. Find the quest and mark it done in ONE atomic step. If two requests race,
  // only one of them matches { done: false }, so XP and gold can never be paid twice.
  const quest = await Quest.findOneAndUpdate(
    { _id: req.params.id, userId: req.user._id, done: false },
    { $set: { done: true, completedAt: now, completedDay: today } },
    { new: true }
  );
  if (!quest) {
    const exists = await Quest.exists({ _id: req.params.id, userId: req.user._id });
    throw exists
      ? new AppError(409, "You've already completed this quest.", "ALREADY_COMPLETED")
      : new AppError(404, "Quest not found.", "NOT_FOUND");
  }

  // 3 to 6. XP and levels, gold, stat, category count, streak, badges.
  let outcome;
  try {
    outcome = await updateUser(req.user._id, (user) => {
      const startLevel = user.level;
      const leveled = addXp(user.level, user.xp, quest.xp);
      user.level = leveled.level;
      user.xp = leveled.xp;
      user.gold += quest.gold;
      user.totalDone += 1;
      user.set(`attrs.${quest.attribute}`, (user.attrs[quest.attribute] ?? 0) + 1);
      user.set(`catDone.${quest.category}`, (user.catDone[quest.category] ?? 0) + 1);

      const streak = applyCompletion(user, today);
      user.streak = streak.streak;
      user.longestStreak = streak.longestStreak;
      user.lastCompletedDate = streak.lastCompletedDate;

      return { leveledUp: leveled.leveledUp, startLevel, newBadges: grantBadges(user, now) };
    });
  } catch (err) {
    // The player update failed, so hand the quest back rather than eat the completion.
    await Quest.updateOne({ _id: quest._id }, { $set: { done: false, completedAt: null, completedDay: null } });
    throw err;
  }

  const { user, result } = outcome;

  // 7. Activity entries.
  const entries = [{ type: "quest", title: `Completed "${quest.title}"`, reward: `+${quest.xp} XP` }];
  if (result.leveledUp) entries.push({ type: "levelup", title: `Reached level ${user.level}` });
  result.newBadges.forEach((b) => entries.push({ type: "badge", title: `Earned the "${b.name}" badge` }));
  await logActivities(user._id, tz, entries, now);

  // 8. Same fields GameContext.completeQuest works out locally today.
  res.json({
    player: await buildPlayer(user, now),
    quest: questDTO(quest, tz, now),
    reward: { xp: quest.xp, gold: quest.gold },
    leveledUp: result.leveledUp,
    newLevel: result.leveledUp ? user.level : null,
    newBadges: result.newBadges.map((b) => badgeDTO(b, now)),
  });
});
