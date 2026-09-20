import { test } from "node:test";
import assert from "node:assert/strict";
import { xpToNext, addXp } from "../game-engine/xpCurve.js";
import { rewardFor, canAfford } from "../game-engine/economy.js";
import { BADGES, evaluateBadges } from "../game-engine/badges.js";
import { applyCompletion, effectiveStreak } from "../game-engine/streak.js";
import { normalizeRepeat } from "../game-engine/constants.js";
import { addDays, dayKey, diffDays, friendlyTime, isDayKey, weekStart } from "../utils/dates.js";

test("xp curve matches the numbers in the frontend comment", () => {
  assert.equal(xpToNext(1), 380);
  assert.equal(xpToNext(2), 540);
  assert.equal(xpToNext(7), 1940);
});

test("addXp rolls over one level, several levels, and none", () => {
  assert.deepEqual(addXp(1, 0, 100), { level: 1, xp: 100, leveledUp: false });
  assert.deepEqual(addXp(1, 300, 100), { level: 2, xp: 20, leveledUp: true });
  // 380 + 540 = 920 gets you to level 3 exactly
  assert.deepEqual(addXp(1, 0, 920), { level: 3, xp: 0, leveledUp: true });
});

test("rewards and affordability", () => {
  assert.deepEqual(rewardFor("Epic"), { xp: 80, gold: 16 });
  assert.deepEqual(rewardFor("nonsense"), { xp: 30, gold: 6 });
  assert.equal(canAfford(40, 40), true);
  assert.equal(canAfford(39, 40), false);
});

test("there are 19 badges and progress is capped at the target", () => {
  assert.equal(BADGES.length, 19);
  const player = { level: 5, totalDone: 3, streak: 0, longestStreak: 7, catDone: { Food: 20, Fitness: 0, Study: 0, Sleep: 0, General: 0 } };
  const byId = Object.fromEntries(evaluateBadges(player, ["iron"]).map((b) => [b.id, b]));
  assert.equal(byId["food-3"].unlocked, true);
  assert.equal(byId["food-3"].value, 15); // 20 done, shown as 15/15
  assert.equal(byId["week-warrior"].unlocked, true); // longest streak counts
  assert.equal(byId["rising-hunter"].unlocked, true);
  assert.equal(byId["framed"].unlocked, true);
  assert.equal(byId["monarch"].unlocked, false);
});

test("streak: first quest, same day, next day, and a gap", () => {
  const base = { streak: 0, longestStreak: 0, lastCompletedDate: null };
  const first = applyCompletion(base, "2026-09-20");
  assert.deepEqual(first, { streak: 1, longestStreak: 1, lastCompletedDate: "2026-09-20" });

  const same = applyCompletion(first, "2026-09-20");
  assert.equal(same.streak, 1);

  const next = applyCompletion(first, "2026-09-21");
  assert.equal(next.streak, 2);
  assert.equal(next.longestStreak, 2);

  const gap = applyCompletion({ streak: 5, longestStreak: 5, lastCompletedDate: "2026-09-10" }, "2026-09-20");
  assert.deepEqual(gap, { streak: 1, longestStreak: 5, lastCompletedDate: "2026-09-20" });
});

test("streak at risk / broken is worked out from the last completed day", () => {
  const p = { streak: 4, lastCompletedDate: "2026-09-19" };
  assert.deepEqual(effectiveStreak(p, "2026-09-19"), { streak: 4, atRisk: false });
  assert.deepEqual(effectiveStreak(p, "2026-09-20"), { streak: 4, atRisk: true });
  assert.deepEqual(effectiveStreak(p, "2026-09-21"), { streak: 0, atRisk: false });
  assert.deepEqual(effectiveStreak({ streak: 0, lastCompletedDate: null }, "2026-09-20"), { streak: 0, atRisk: false });
});

test("repeat names from the frontend dropdown are understood", () => {
  assert.equal(normalizeRepeat("Daily quest"), "Daily");
  assert.equal(normalizeRepeat("Daily"), "Daily");
  assert.equal(normalizeRepeat("One-time"), "One-time");
  assert.equal(normalizeRepeat("Weekly"), "Weekly");
  assert.equal(normalizeRepeat("hourly"), null);
  assert.equal(normalizeRepeat(undefined), null);
});

test("day keys follow the player's timezone, not the server's", () => {
  const moment = new Date("2026-09-20T20:00:00Z"); // 01:30 the next morning in India
  assert.equal(dayKey(moment, "UTC"), "2026-09-20");
  assert.equal(dayKey(moment, "Asia/Kolkata"), "2026-09-21");
  assert.equal(dayKey(moment, "America/Los_Angeles"), "2026-09-20");
});

test("day arithmetic", () => {
  assert.equal(addDays("2026-09-30", 1), "2026-10-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
  assert.equal(diffDays("2026-09-20", "2026-09-19"), 1);
  assert.equal(weekStart("2026-09-20"), "2026-09-14"); // Sunday -> Monday before it
  assert.equal(weekStart("2026-09-14"), "2026-09-14");
  assert.equal(isDayKey("2026-02-30"), false);
  assert.equal(isDayKey("2026-09-20"), true);
});

test("friendly times", () => {
  const now = new Date("2026-09-20T12:00:00Z");
  assert.equal(friendlyTime(new Date("2026-09-20T11:59:40Z"), "UTC", now), "Just now");
  assert.equal(friendlyTime(new Date("2026-09-20T09:12:00Z"), "UTC", now), "9:12am");
  assert.equal(friendlyTime(new Date("2026-09-19T20:40:00Z"), "UTC", now), "Yesterday, 8:40pm");
  assert.equal(friendlyTime(new Date("2026-09-17T20:40:00Z"), "UTC", now), "3 days ago");
  assert.equal(friendlyTime(new Date("2026-09-02T20:40:00Z"), "UTC", now), "Sep 2");
});
