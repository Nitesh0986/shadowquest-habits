// Day maths in the player's own timezone.
const MS_PER_DAY = 86_400_000;
const formatters = new Map();

function dayFormatter(tz) {
  let f = formatters.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" });
    formatters.set(tz, f);
  }
  return f;
}

export function isValidTimezone(tz) {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// The calendar day a moment falls on, for someone living in `tz`.
export function dayKey(date, tz = "UTC") {
  const d = typeof date === "string" ? new Date(date) : date;
  const parts = dayFormatter(tz).formatToParts(d);
  const get = (type) => parts.find((p) => p.type === type).value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function toUtc(key) {
  const [y, m, d] = key.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

export function isDayKey(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  return new Date(toUtc(value)).toISOString().slice(0, 10) === value;
}

export function addDays(key, n) {
  return new Date(toUtc(key) + n * MS_PER_DAY).toISOString().slice(0, 10);
}

// a - b, in whole days.
export function diffDays(a, b) {
  return Math.round((toUtc(a) - toUtc(b)) / MS_PER_DAY);
}

export const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function weekdayIndex(key) {
  return new Date(toUtc(key)).getUTCDay(); // 0 = Sunday
}

export function dayName(key) {
  return DAY_NAMES[weekdayIndex(key)];
}

// Weeks start on Monday.
export function weekStart(key) {
  return addDays(key, -((weekdayIndex(key) + 6) % 7));
}

export function longDate(key) {
  const [, m, d] = key.split("-").map(Number);
  return `${MONTHS[m - 1]} ${d}`;
}

// "9:12am"
export function formatClock(date, tz = "UTC") {
  const d = typeof date === "string" ? new Date(date) : date;
  return d
    .toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: tz })
    .replace(/\s/g, "")
    .toLowerCase();
}

// "Just now", "9:12am", "Yesterday, 8:40pm", "3 days ago", "Sep 2"
export function friendlyTime(date, tz = "UTC", now = new Date()) {
  const d = typeof date === "string" ? new Date(date) : date;
  if (now - d < 60_000) return "Just now";
  const gap = diffDays(dayKey(now, tz), dayKey(d, tz));
  if (gap <= 0) return formatClock(d, tz);
  if (gap === 1) return `Yesterday, ${formatClock(d, tz)}`;
  if (gap < 7) return `${gap} days ago`;
  return longDate(dayKey(d, tz));
}
