// Small shared lists that the frontend keeps in dummyData.js / QuestLog.jsx.
export const ATTRIBUTES = ["Strength", "Intellect", "Discipline", "Charisma"];

// Stored values. The frontend's dropdown says "Daily quest"; we accept that too.
export const REPEATS = ["One-time", "Daily", "Weekly"];

// What the quest card shows as its subtitle for each repeat type.
export const REPEAT_LABELS = { "One-time": "One-time", Daily: "Daily quest", Weekly: "Weekly" };

const ALIASES = {
  "one-time": "One-time",
  onetime: "One-time",
  once: "One-time",
  daily: "Daily",
  "daily quest": "Daily",
  weekly: "Weekly",
  "weekly quest": "Weekly",
};

// Returns the stored value, or null if it isn't a repeat type we know.
export function normalizeRepeat(value) {
  if (typeof value !== "string") return null;
  return ALIASES[value.trim().toLowerCase()] ?? null;
}
