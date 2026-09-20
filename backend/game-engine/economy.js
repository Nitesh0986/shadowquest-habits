// What each difficulty pays out.
export const DIFFICULTIES = {
  Easy: { xp: 15, gold: 3 },
  Normal: { xp: 30, gold: 6 },
  Hard: { xp: 50, gold: 10 },
  Epic: { xp: 80, gold: 16 },
};

export function rewardFor(difficulty) {
  return DIFFICULTIES[difficulty] ?? DIFFICULTIES.Normal;
}

export function canAfford(gold, price) {
  return gold >= price;
}
