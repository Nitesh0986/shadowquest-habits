// Non-linear leveling: every level needs more XP than the one before.
// Level 1 -> 380, level 2 -> 540, ... level 7 -> 1,940.
// Later this moves to the backend so the client can't cheat.
export function xpToNext(level) {
  return 20 * level * level + 100 * level + 260;
}

// Adds XP and rolls over into new levels. Returns the new state.
export function addXp(level, xp, gain) {
  let nextLevel = level;
  let nextXp = xp + gain;
  let leveledUp = false;

  while (nextXp >= xpToNext(nextLevel)) {
    nextXp -= xpToNext(nextLevel);
    nextLevel += 1;
    leveledUp = true;
  }

  return { level: nextLevel, xp: nextXp, leveledUp };
}
