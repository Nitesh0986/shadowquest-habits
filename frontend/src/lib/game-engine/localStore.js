import { addDays, dayKey, dayName, diffDays, formatClock, friendlyTime, longDate, weekStart } from "./dates.js";
import { applyCompletion, effectiveStreak } from "./streak.js";
import { evaluateBadges, newlyUnlocked } from "./badges.js";
import { addXp, xpToNext } from "./xpCurve.js";
import { rewardFor } from "./economy.js";
import { FRAMES } from "./frames.js";

const STORAGE_KEYS = {
  PLAYER: "shadowquest_player",
  QUESTS: "shadowquest_quests",
  ACTIVITY: "shadowquest_activity",
  SESSION: "shadowquest_token",
};

export const REPEAT_LABELS = {
  "One-time": "One-time quest",
  "Daily": "Daily quest",
  "Daily quest": "Daily quest",
  "Weekly": "Weekly quest",
};

const ACTIVITY_ICONS = { quest: "✓", levelup: "▲", badge: "★", purchase: "◆" };

function makeDefaultPlayer(email = "demo@shadowquest.test", name = "Aris Hollow") {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  return {
    id: `player_${Date.now()}`,
    name,
    email,
    level: 1,
    xp: 0,
    gold: 46,
    streak: 0,
    longestStreak: 0,
    lastCompletedDate: null,
    totalDone: 0,
    attrs: { Strength: 0, Intellect: 0, Discipline: 0, Charisma: 0 },
    catDone: { Food: 0, Fitness: 0, Study: 0, Sleep: 0, General: 0 },
    ownedFrames: [],
    equippedFrame: null,
    settings: { reminders: true, streakAlerts: true, sounds: false },
    timezone: tz,
    createdAt: new Date().toISOString(),
  };
}

function makeDefaultQuests(tz) {
  const today = dayKey(new Date(), tz);
  return [
    { id: "q1", title: "Eat a proper breakfast", category: "Food", attribute: "Discipline", difficulty: "Easy", repeat: "Daily quest", dueDate: null, done: false, completedDay: null, completedAt: null, createdAt: new Date().toISOString() },
    { id: "q2", title: "Finish chapter 4 of Deep Work", category: "Study", attribute: "Intellect", difficulty: "Normal", repeat: "Daily quest", dueDate: null, done: false, completedDay: null, completedAt: null, createdAt: new Date().toISOString() },
    { id: "q3", title: "Leg day: squats & lunges", category: "Fitness", attribute: "Strength", difficulty: "Hard", repeat: "Weekly", dueDate: null, done: false, completedDay: null, completedAt: null, createdAt: new Date().toISOString() },
    { id: "q4", title: "Lights out by 11pm", category: "Sleep", attribute: "Discipline", difficulty: "Normal", repeat: "Daily quest", dueDate: null, done: false, completedDay: null, completedAt: null, createdAt: new Date().toISOString() },
    { id: "q5", title: "Call mum", category: "General", attribute: "Charisma", difficulty: "Easy", repeat: "One-time", dueDate: null, done: false, completedDay: null, completedAt: null, createdAt: new Date().toISOString() },
    { id: "q6", title: "Submit tax documents", category: "General", attribute: "Discipline", difficulty: "Hard", repeat: "One-time", dueDate: addDays(today, -1), done: false, completedDay: null, completedAt: null, createdAt: new Date().toISOString() },
  ];
}

export function loadStoredData() {
  let player = null;
  let quests = [];
  let activity = [];

  try {
    const rawP = localStorage.getItem(STORAGE_KEYS.PLAYER);
    if (rawP) player = JSON.parse(rawP);
  } catch {}

  try {
    const rawQ = localStorage.getItem(STORAGE_KEYS.QUESTS);
    if (rawQ) quests = JSON.parse(rawQ);
  } catch {}

  try {
    const rawA = localStorage.getItem(STORAGE_KEYS.ACTIVITY);
    if (rawA) activity = JSON.parse(rawA);
  } catch {}

  return { player, quests, activity };
}

export function saveStoredData({ player, quests, activity }) {
  if (player !== undefined) {
    if (player === null) localStorage.removeItem(STORAGE_KEYS.PLAYER);
    else localStorage.setItem(STORAGE_KEYS.PLAYER, JSON.stringify(player));
  }
  if (quests !== undefined) {
    if (quests === null) localStorage.removeItem(STORAGE_KEYS.QUESTS);
    else localStorage.setItem(STORAGE_KEYS.QUESTS, JSON.stringify(quests));
  }
  if (activity !== undefined) {
    if (activity === null) localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
    else localStorage.setItem(STORAGE_KEYS.ACTIVITY, JSON.stringify(activity));
  }
}

export function initSession(email, name = "Aris Hollow") {
  let { player, quests, activity } = loadStoredData();

  if (!player || (email && player.email !== email)) {
    player = makeDefaultPlayer(email || "demo@shadowquest.test", name);
    quests = makeDefaultQuests(player.timezone);
    activity = [];
    saveStoredData({ player, quests, activity });
  }

  localStorage.setItem(STORAGE_KEYS.SESSION, "session_active");
  return { player, quests, activity };
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
}

export function deleteLocalAccount() {
  localStorage.removeItem(STORAGE_KEYS.SESSION);
  localStorage.removeItem(STORAGE_KEYS.PLAYER);
  localStorage.removeItem(STORAGE_KEYS.QUESTS);
  localStorage.removeItem(STORAGE_KEYS.ACTIVITY);
}

export function applyLazyResets(quests, tz, now = new Date()) {
  const today = dayKey(now, tz);
  return quests.map((q) => {
    if (q.done && (q.repeat === "Daily" || q.repeat === "Daily quest")) {
      if (q.completedDay && q.completedDay < today) {
        return { ...q, done: false, completedDay: null, completedAt: null };
      }
    }
    if (q.done && q.repeat === "Weekly") {
      if (q.completedDay && weekStart(q.completedDay) < weekStart(today)) {
        return { ...q, done: false, completedDay: null, completedAt: null };
      }
    }
    return q;
  });
}

export function formatQuest(quest, tz, now = new Date()) {
  const today = dayKey(now, tz);
  const isOneTime = quest.repeat === "One-time";
  const overdue = !quest.done && isOneTime && !!quest.dueDate && quest.dueDate < today;
  const doneToday = Boolean(quest.done && quest.completedDay === today);

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
    meta = REPEAT_LABELS[quest.repeat] || "Daily quest";
  }

  const dueToday = quest.done
    ? doneToday
    : !isOneTime || !quest.dueDate || quest.dueDate <= today;

  const reward = rewardFor(quest.difficulty);

  return {
    ...quest,
    xp: quest.xp || reward.xp,
    gold: quest.gold || reward.gold,
    meta,
    overdue,
    done: Boolean(quest.done),
    doneToday,
    dueToday,
  };
}

export function formatPlayer(player, activity, now = new Date()) {
  if (!player) return null;
  const tz = player.timezone || "UTC";
  const today = dayKey(now, tz);
  const streakInfo = effectiveStreak(player, today);

  const counts = {};
  [-6, -5, -4, -3, -2, -1, 0].forEach((offset) => {
    counts[addDays(today, offset)] = 0;
  });

  (activity || []).forEach((act) => {
    if (act.type === "quest" && act.day && counts[act.day] !== undefined) {
      counts[act.day] += 1;
    }
  });

  const historicalDone = [-6, -5, -4, -3, -2, -1].reduce((sum, offset) => {
    return sum + (counts[addDays(today, offset)] || 0);
  }, 0);

  const joinedDaysAgo = Math.max(0, diffDays(today, dayKey(player.createdAt, tz)));

  return {
    ...player,
    streak: streakInfo.streak,
    streakAtRisk: streakInfo.atRisk,
    xpToNext: xpToNext(player.level),
    joinedDaysAgo,
    weekDone: historicalDone,
  };
}

export function computeWeek(activity, tz, now = new Date()) {
  const today = dayKey(now, tz);
  const counts = {};
  [-6, -5, -4, -3, -2, -1, 0].forEach((offset) => {
    counts[addDays(today, offset)] = 0;
  });

  (activity || []).forEach((act) => {
    if (act.type === "quest" && act.day && counts[act.day] !== undefined) {
      counts[act.day] += 1;
    }
  });

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

  return { bars, today: todayBar, weekDone, total: weekDone + todayBar.count };
}

export function formatShop(player) {
  const owned = player?.ownedFrames || [];
  const equipped = player?.equippedFrame || null;
  return FRAMES.map((f) => ({
    ...f,
    owned: owned.includes(f.id),
    equipped: equipped === f.id,
  }));
}

export function formatBadges(player) {
  if (!player) return [];
  return evaluateBadges(player, player.ownedFrames || []);
}

export function formatActivity(activityList, tz, now = new Date()) {
  return (activityList || []).slice(0, 6).map((act) => ({
    ...act,
    icon: ACTIVITY_ICONS[act.type] || "✓",
    time: friendlyTime(act.createdAt, tz, now),
  }));
}
