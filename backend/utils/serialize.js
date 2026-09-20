// Turns database documents into the shapes the frontend already uses
// (see src/data/dummyData.js): same field names, same meta strings.
import { xpToNext } from "../game-engine/xpCurve.js";
import { effectiveStreak } from "../game-engine/streak.js";
import { REPEAT_LABELS } from "../game-engine/constants.js";
import { dayKey, diffDays, friendlyTime, formatClock, longDate } from "./dates.js";

export function playerDTO(user, { weekDone = 0, now = new Date() } = {}) {
  const tz = user.timezone;
  const today = dayKey(now, tz);
  const { streak, atRisk } = effectiveStreak(user, today);

  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    level: user.level,
    xp: user.xp,
    xpToNext: xpToNext(user.level),
    gold: user.gold,
    streak,
    streakAtRisk: atRisk,
    longestStreak: user.longestStreak,
    totalDone: user.totalDone,
    joinedDaysAgo: Math.max(0, diffDays(today, dayKey(user.createdAt, tz))),
    // Quests finished in the 6 days before today. The dashboard adds today's on top.
    weekDone,
    attrs: {
      Strength: user.attrs.Strength,
      Intellect: user.attrs.Intellect,
      Discipline: user.attrs.Discipline,
      Charisma: user.attrs.Charisma,
    },
    catDone: {
      Food: user.catDone.Food,
      Fitness: user.catDone.Fitness,
      Study: user.catDone.Study,
      Sleep: user.catDone.Sleep,
      General: user.catDone.General,
    },
    ownedFrames: [...user.ownedFrames],
    equippedFrame: user.equippedFrame ?? null,
    settings: {
      reminders: user.settings.reminders,
      streakAlerts: user.settings.streakAlerts,
      sounds: user.settings.sounds,
    },
    timezone: user.timezone,
    createdAt: user.createdAt,
  };
}

export function questDTO(quest, tz, now = new Date()) {
  const today = dayKey(now, tz);
  const isOneTime = quest.repeat === "One-time";
  const overdue = !quest.done && isOneTime && !!quest.dueDate && quest.dueDate < today;
  const doneToday = quest.done && quest.completedDay === today;

  let meta;
  if (quest.done && quest.completedAt) {
    meta = doneToday
      ? `Completed ${formatClock(quest.completedAt, tz)}`
      : `Completed ${longDate(quest.completedDay ?? dayKey(quest.completedAt, tz))}`;
  } else if (overdue) {
    const gap = diffDays(today, quest.dueDate);
    meta = gap === 1 ? "Due yesterday" : `Due ${gap} days ago`;
  } else if (isOneTime && quest.dueDate) {
    meta = quest.dueDate === today ? "Due today" : `Due ${longDate(quest.dueDate)}`;
  } else {
    meta = REPEAT_LABELS[quest.repeat];
  }

  // Which quests belong on today's dashboard list.
  const dueToday = quest.done
    ? doneToday
    : !isOneTime || !quest.dueDate || quest.dueDate <= today;

  return {
    id: String(quest._id),
    title: quest.title,
    category: quest.category,
    attribute: quest.attribute,
    difficulty: quest.difficulty,
    xp: quest.xp,
    gold: quest.gold,
    repeat: quest.repeat,
    dueDate: quest.dueDate,
    meta,
    overdue,
    done: quest.done,
    doneToday,
    dueToday,
    completedAt: quest.completedAt,
    createdAt: quest.createdAt,
  };
}

const ACTIVITY_ICONS = { quest: "✓", levelup: "▲", badge: "★", purchase: "◆" };

export function activityDTO(activity, tz, now = new Date()) {
  return {
    id: String(activity._id),
    type: activity.type,
    icon: ACTIVITY_ICONS[activity.type],
    title: activity.title,
    time: friendlyTime(activity.createdAt, tz, now),
    reward: activity.reward,
    createdAt: activity.createdAt,
  };
}

// A badge from evaluateBadges(), trimmed to what the UI needs.
export function badgeDTO(badge, unlockedAt = null) {
  const { id, group, tier, icon, name, hint, metric, target, value, unlocked } = badge;
  return { id, group, tier: tier ?? null, icon, name, hint, metric, target, value, unlocked, unlockedAt };
}

export function frameDTO(frame, user) {
  return {
    ...frame,
    owned: user.ownedFrames.includes(frame.id),
    equipped: user.equippedFrame === frame.id,
  };
}
