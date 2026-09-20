// Badge rules. Pure functions only, so this file can move to the backend later
// and the client just displays what the server says is unlocked.

// The four "daily life" categories a quest can belong to, plus a catch-all.
// Each category owns a colour and an icon so it is recognisable at a glance.
export const CATEGORIES = {
  Food: { color: "#7bd66a", icon: "apple", blurb: "Meals, water and eating well" },
  Fitness: { color: "#ff6b3d", icon: "dumbbell", blurb: "Workouts, walks and moving more" },
  Study: { color: "#5b8cff", icon: "book", blurb: "Reading, revision and deep work" },
  Sleep: { color: "#a98bff", icon: "moon", blurb: "Bedtimes and early wake-ups" },
  General: { color: "#b8bcc8", icon: "star", blurb: "Everything else on your list" },
};

export const QUEST_CATEGORIES = Object.keys(CATEGORIES);

// Picking a category pre-selects the stat it most naturally trains.
export const CATEGORY_ATTRIBUTE = {
  Food: "Discipline",
  Fitness: "Strength",
  Study: "Intellect",
  Sleep: "Discipline",
  General: "Discipline",
};

// Badges are grouped. Each group has its own medal shape and colour,
// so a Fitness hexagon can never be confused with a Study shield.
export const BADGE_GROUPS = [
  { id: "Food", label: "Food", shape: "circle", color: CATEGORIES.Food.color, blurb: "Earned by completing Food quests" },
  { id: "Fitness", label: "Fitness", shape: "hex", color: CATEGORIES.Fitness.color, blurb: "Earned by completing Fitness quests" },
  { id: "Study", label: "Study", shape: "shield", color: CATEGORIES.Study.color, blurb: "Earned by completing Study quests" },
  { id: "Sleep", label: "Sleep", shape: "diamond", color: CATEGORIES.Sleep.color, blurb: "Earned by completing Sleep quests" },
  { id: "Milestone", label: "Milestones", shape: "seal", color: "#f0c24b", blurb: "Earned by levelling up and keeping streaks" },
];

// metric: what is being counted. target: how many it takes.
// tier (1-3) is shown as pips under the medal; milestones have no tier.
export const BADGES = [
  // Food
  { id: "food-1", group: "Food", tier: 1, icon: "apple", name: "First bite", hint: "Complete 1 Food quest", metric: "Food", target: 1 },
  { id: "food-2", group: "Food", tier: 2, icon: "utensils", name: "Clean plate", hint: "Complete 5 Food quests", metric: "Food", target: 5 },
  { id: "food-3", group: "Food", tier: 3, icon: "chef", name: "Iron chef", hint: "Complete 15 Food quests", metric: "Food", target: 15 },

  // Fitness
  { id: "fit-1", group: "Fitness", tier: 1, icon: "dumbbell", name: "First rep", hint: "Complete 1 Fitness quest", metric: "Fitness", target: 1 },
  { id: "fit-2", group: "Fitness", tier: 2, icon: "pulse", name: "Heart pumper", hint: "Complete 5 Fitness quests", metric: "Fitness", target: 5 },
  { id: "fit-3", group: "Fitness", tier: 3, icon: "bolt", name: "Beast mode", hint: "Complete 15 Fitness quests", metric: "Fitness", target: 15 },

  // Study
  { id: "study-1", group: "Study", tier: 1, icon: "book", name: "First page", hint: "Complete 1 Study quest", metric: "Study", target: 1 },
  { id: "study-2", group: "Study", tier: 2, icon: "bulb", name: "Bright spark", hint: "Complete 5 Study quests", metric: "Study", target: 5 },
  { id: "study-3", group: "Study", tier: 3, icon: "cap", name: "Scholar", hint: "Complete 15 Study quests", metric: "Study", target: 15 },

  // Sleep
  { id: "sleep-1", group: "Sleep", tier: 1, icon: "moon", name: "Lights out", hint: "Complete 1 Sleep quest", metric: "Sleep", target: 1 },
  { id: "sleep-2", group: "Sleep", tier: 2, icon: "zzz", name: "Deep sleeper", hint: "Complete 5 Sleep quests", metric: "Sleep", target: 5 },
  { id: "sleep-3", group: "Sleep", tier: 3, icon: "sunrise", name: "Dawn rider", hint: "Complete 15 Sleep quests", metric: "Sleep", target: 15 },

  // Milestones
  { id: "first-blood", group: "Milestone", icon: "sword", name: "First blood", hint: "Complete your first quest", metric: "quests", target: 1 },
  { id: "awakened", group: "Milestone", icon: "spark", name: "Awakened", hint: "Reach level 2", metric: "level", target: 2 },
  { id: "framed", group: "Milestone", icon: "frame", name: "Framed", hint: "Buy your first avatar frame", metric: "frames", target: 1 },
  { id: "week-warrior", group: "Milestone", icon: "flame", name: "Week warrior", hint: "Keep a 7-day streak", metric: "streak", target: 7 },
  { id: "rising-hunter", group: "Milestone", icon: "chevrons", name: "Rising hunter", hint: "Reach level 5", metric: "level", target: 5 },
  { id: "iron-month", group: "Milestone", icon: "calendar", name: "Iron month", hint: "Keep a 30-day streak", metric: "streak", target: 30 },
  { id: "monarch", group: "Milestone", icon: "crown", name: "Monarch", hint: "Reach level 10", metric: "level", target: 10 },
];

export function groupOf(badge) {
  return BADGE_GROUPS.find((g) => g.id === badge.group) ?? BADGE_GROUPS[0];
}

function currentValue(metric, player, owned) {
  switch (metric) {
    case "quests":
      return player.totalDone;
    case "level":
      return player.level;
    case "streak":
      return Math.max(player.streak, player.longestStreak);
    case "frames":
      return owned.length;
    default:
      // Food, Fitness, Study, Sleep
      return player.catDone?.[metric] ?? 0;
  }
}

// Every badge with its live progress. `value` is capped at `target`.
export function evaluateBadges(player, owned) {
  return BADGES.map((badge) => {
    const raw = currentValue(badge.metric, player, owned);
    return { ...badge, value: Math.min(raw, badge.target), unlocked: raw >= badge.target };
  });
}

// Badges that are unlocked after a change but were not before it.
export function newlyUnlocked(before, after) {
  const had = new Set(evaluateBadges(before.player, before.owned).filter((b) => b.unlocked).map((b) => b.id));
  return evaluateBadges(after.player, after.owned).filter((b) => b.unlocked && !had.has(b.id));
}
