import { diffDays } from "./dates.js";

// Called when the player completes a quest on day `today`.
export function applyCompletion({ streak, longestStreak, lastCompletedDate }, today) {
  let next;
  const gap = lastCompletedDate ? diffDays(today, lastCompletedDate) : null;

  if (gap === null) next = 1; // very first quest
  else if (gap <= 0) next = Math.max(streak, 1); // already completed one today
  else if (gap === 1) next = streak + 1; // yesterday -> today, streak continues
  else next = 1; // missed at least one day, start again

  return {
    streak: next,
    longestStreak: Math.max(longestStreak, next),
    lastCompletedDate: today,
  };
}

// What to show the player today, without changing anything stored.
export function effectiveStreak({ streak, lastCompletedDate }, today) {
  if (!lastCompletedDate) return { streak: 0, atRisk: false };
  const gap = diffDays(today, lastCompletedDate);
  if (gap <= 0) return { streak, atRisk: false };
  if (gap === 1) return { streak, atRisk: streak > 0 };
  return { streak: 0, atRisk: false };
}
