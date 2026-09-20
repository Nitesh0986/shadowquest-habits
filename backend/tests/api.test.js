// End-to-end test of the whole API against a real MongoDB.
// It is skipped unless you point it at one:
//
//   TEST_MONGO_URI=mongodb://127.0.0.1:27017/shadowquest_test npm test
//
// It only creates its own throwaway player (random email) and deletes it at the end.
import { test, before, after } from "node:test";
import assert from "node:assert/strict";

const MONGO = process.env.TEST_MONGO_URI;
const skip = MONGO ? false : "set TEST_MONGO_URI to run the API tests";
// The "at the same moment" tests rely on MongoDB applying a filtered update atomically,
// which real MongoDB and Atlas do. Some lightweight emulators don't, so you can skip
// these three with SKIP_RACE_TESTS=1 when testing against one.
const race = process.env.SKIP_RACE_TESTS ? { skip: "SKIP_RACE_TESTS is set" } : {};

let server, base, mongoose, User, Quest, dates;

before(async () => {
  if (!MONGO) return;
  process.env.NODE_ENV = "test";
  process.env.MONGO_URI = MONGO;
  process.env.JWT_SECRET = "test-secret";
  process.env.DEFAULT_TIMEZONE = "UTC";
  mongoose = (await import("mongoose")).default;
  User = (await import("../models/User.js")).default;
  Quest = (await import("../models/Quest.js")).default;
  dates = await import("../utils/dates.js");
  const { default: app } = await import("../app.js");
  await mongoose.connect(MONGO);
  await Promise.all([User.init(), Quest.init()]); // make sure the unique email index exists
  server = app.listen(0);
  base = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!MONGO) return;
  server?.close();
  await mongoose?.disconnect();
});

let token;
async function api(method, path, body, useToken = token) {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(useToken ? { Authorization: `Bearer ${useToken}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const email = `test-${Date.now()}-${Math.floor(Math.random() * 1e6)}@example.com`;
const password = "password123";

test("ShadowQuest API", { skip }, async (t) => {
  let playerId;
  const today = () => dates.dayKey(new Date(), "UTC");
  const makeQuest = async (over = {}) =>
    (await api("POST", "/api/quests", { title: "Quest", category: "General", difficulty: "Easy", ...over })).body.quest;

  await t.test("health check and auth guard", async () => {
    assert.equal((await api("GET", "/api/health")).status, 200);
    assert.equal((await api("GET", "/api/quests")).status, 401);
    assert.equal((await api("GET", "/api/quests", undefined, "garbage")).status, 401);
  });

  await t.test("signup validates, creates a level 1 player, rejects duplicates", async () => {
    assert.equal((await api("POST", "/api/auth/signup", { name: "A", email, password })).status, 400);
    assert.equal((await api("POST", "/api/auth/signup", { name: "Test Hero", email: "nope", password })).status, 400);
    assert.equal((await api("POST", "/api/auth/signup", { name: "Test Hero", email, password: "short" })).status, 400);

    const ok = await api("POST", "/api/auth/signup", { name: "Test Hero", email: email.toUpperCase(), password });
    assert.equal(ok.status, 201);
    token = ok.body.token;
    playerId = ok.body.player.id;
    const p = ok.body.player;
    assert.equal(p.email, email); // stored lowercase
    assert.equal(p.level, 1);
    assert.equal(p.xp, 0);
    assert.equal(p.gold, 0);
    assert.equal(p.xpToNext, 380);
    assert.equal(p.streak, 0);
    assert.equal(p.streakAtRisk, false);
    assert.equal(p.passwordHash, undefined);

    assert.equal((await api("POST", "/api/auth/signup", { name: "Twin", email, password })).status, 409);
  });

  await t.test("login and /me", async () => {
    assert.equal((await api("POST", "/api/auth/login", { email, password: "wrong-password" })).status, 401);
    assert.equal((await api("POST", "/api/auth/login", { email: "who@example.com", password })).status, 401);
    const ok = await api("POST", "/api/auth/login", { email, password });
    assert.equal(ok.status, 200);
    token = ok.body.token;
    assert.equal((await api("GET", "/api/auth/me")).body.player.id, playerId);
  });

  await t.test("creating quests: validation, rewards, frontend repeat names", async () => {
    assert.equal((await api("POST", "/api/quests", { title: "  " })).status, 400);
    assert.equal((await api("POST", "/api/quests", { title: "x", category: "Cooking" })).status, 400);
    assert.equal((await api("POST", "/api/quests", { title: "x", difficulty: "Godly" })).status, 400);
    assert.equal((await api("POST", "/api/quests", { title: "x", repeat: "Hourly" })).status, 400);

    const res = await api("POST", "/api/quests", {
      title: "Read 20 pages", category: "Study", difficulty: "Normal", repeat: "Daily quest",
    });
    assert.equal(res.status, 201);
    const q = res.body.quest;
    assert.equal(q.repeat, "Daily");
    assert.equal(q.meta, "Daily quest");
    assert.equal(q.attribute, "Intellect"); // defaulted from the category
    assert.deepEqual([q.xp, q.gold], [30, 6]);
    assert.equal(q.dueToday, true);
    assert.equal(q.done, false);
  });

  let dailyId;
  await t.test("completing a quest pays out XP, gold, stat, streak and first badges", async () => {
    const list = await api("GET", "/api/quests");
    dailyId = list.body.quests[0].id;

    const res = await api("POST", `/api/quests/${dailyId}/complete`);
    assert.equal(res.status, 200);
    const { player, quest, newBadges, leveledUp } = res.body;
    assert.equal(leveledUp, false);
    assert.equal(player.xp, 30);
    assert.equal(player.gold, 6);
    assert.equal(player.totalDone, 1);
    assert.equal(player.streak, 1);
    assert.equal(player.attrs.Intellect, 1);
    assert.equal(player.catDone.Study, 1);
    assert.equal(quest.done, true);
    assert.match(quest.meta, /^Completed \d{1,2}:\d{2}[ap]m$/);
    assert.deepEqual(newBadges.map((b) => b.id).sort(), ["first-blood", "study-1"]);

    assert.equal((await api("POST", `/api/quests/${dailyId}/complete`)).status, 409);
    assert.equal((await api("POST", "/api/quests/64b7f0f0f0f0f0f0f0f0f0f0/complete")).status, 404);
    assert.equal((await api("POST", "/api/quests/not-an-id/complete")).status, 400);
  });

  await t.test("the same quest completed several times at once pays out once", race, async () => {
    const q = await makeQuest();
    const before = (await api("GET", "/api/player")).body.player;
    const results = await Promise.all([1, 2, 3].map(() => api("POST", `/api/quests/${q.id}/complete`)));
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409, 409]);
    const after = (await api("GET", "/api/player")).body.player;
    assert.equal(after.gold - before.gold, 3);
    assert.equal(after.totalDone - before.totalDone, 1);
  });

  await t.test("two different quests completed at once are both counted", race, async () => {
    const [a, b] = [await makeQuest(), await makeQuest()];
    const before = (await api("GET", "/api/player")).body.player;
    const results = await Promise.all([a, b].map((q) => api("POST", `/api/quests/${q.id}/complete`)));
    assert.deepEqual(results.map((r) => r.status), [200, 200]);
    const after = (await api("GET", "/api/player")).body.player;
    assert.equal(after.totalDone - before.totalDone, 2);
    assert.equal(after.gold - before.gold, 6);
    assert.equal(after.xp - before.xp, 30);
  });

  await t.test("levelling up rolls XP over and unlocks the Awakened badge", async () => {
    let last;
    for (let i = 0; i < 5; i++) {
      const q = await makeQuest({ difficulty: "Epic", category: "Fitness" });
      last = (await api("POST", `/api/quests/${q.id}/complete`)).body;
    }
    // 30 + 15*3 (two easy + ... ) is hard to hand-count, so check the invariants instead:
    assert.equal(last.player.level, 2);
    assert.ok(last.player.xp >= 0 && last.player.xp < last.player.xpToNext);
    const badges = (await api("GET", "/api/badges")).body;
    assert.equal(badges.badges.find((b) => b.id === "awakened").unlocked, true);
    assert.equal(badges.badges.find((b) => b.id === "fit-2").unlocked, true); // 5 Fitness quests
  });

  await t.test("streak continues from yesterday, is flagged at risk, and resets after a gap", async () => {
    const yesterday = dates.addDays(today(), -1);
    await User.updateOne({ _id: playerId }, { streak: 3, longestStreak: 3, lastCompletedDate: yesterday });
    let p = (await api("GET", "/api/player")).body.player;
    assert.equal(p.streak, 3);
    assert.equal(p.streakAtRisk, true);

    const q = await makeQuest();
    p = (await api("POST", `/api/quests/${q.id}/complete`)).body.player;
    assert.equal(p.streak, 4);
    assert.equal(p.streakAtRisk, false);
    assert.equal(p.longestStreak, 4);

    await User.updateOne({ _id: playerId }, { lastCompletedDate: dates.addDays(today(), -3) });
    p = (await api("GET", "/api/player")).body.player;
    assert.equal(p.streak, 0);
    assert.equal(p.streakAtRisk, false);
    const q2 = await makeQuest();
    p = (await api("POST", `/api/quests/${q2.id}/complete`)).body.player;
    assert.equal(p.streak, 1);
    assert.equal(p.longestStreak, 4); // the record stays
  });

  await t.test("daily quests come back the next day; overdue is calculated from the due date", async () => {
    const yesterday = dates.addDays(today(), -1);
    await Quest.updateOne({ _id: dailyId }, { completedDay: yesterday });
    let quests = (await api("GET", "/api/quests")).body.quests;
    assert.equal(quests.find((q) => q.id === dailyId).done, false);

    const late = await makeQuest({ title: "Submit tax documents", dueDate: yesterday });
    assert.equal(late.overdue, true);
    assert.equal(late.meta, "Due yesterday");
    quests = (await api("GET", "/api/quests")).body.quests;
    assert.equal(quests[0].id, late.id); // overdue floats to the top
    const overdue = (await api("GET", "/api/quests?status=overdue")).body.quests;
    assert.deepEqual(overdue.map((q) => q.id), [late.id]);
    assert.equal((await api("GET", "/api/quests?category=Cooking")).status, 400);

    const future = await makeQuest({ dueDate: dates.addDays(today(), 5) });
    assert.equal(future.dueToday, false);
  });

  await t.test("editing and deleting quests", async () => {
    const q = await makeQuest({ title: "Old name" });
    const edited = await api("PATCH", `/api/quests/${q.id}`, { title: "New name", difficulty: "Hard" });
    assert.equal(edited.body.quest.title, "New name");
    assert.deepEqual([edited.body.quest.xp, edited.body.quest.gold], [50, 10]);

    await api("POST", `/api/quests/${q.id}/complete`);
    assert.equal((await api("PATCH", `/api/quests/${q.id}`, { title: "Nope" })).status, 409);

    assert.equal((await api("DELETE", `/api/quests/${q.id}`)).status, 200);
    assert.equal((await api("DELETE", `/api/quests/${q.id}`)).status, 404);
  });

  await t.test("shop: buy, insufficient gold, double buy, equip toggle", async () => {
    await User.updateOne({ _id: playerId }, { gold: 100 });

    const shop = (await api("GET", "/api/shop")).body;
    assert.equal(shop.items.length, 6);
    assert.equal(shop.items[0].owned, false);

    const broke = await api("POST", "/api/shop/sigil/buy");
    assert.equal(broke.status, 400);
    assert.equal(broke.body.code, "INSUFFICIENT_GOLD");
    assert.equal(broke.body.needed, 150);
    assert.equal((await api("POST", "/api/shop/nonsense/buy")).status, 404);
    assert.equal((await api("POST", "/api/shop/iron/equip")).status, 403); // not owned yet

    const bought = await api("POST", "/api/shop/iron/buy");
    assert.equal(bought.status, 200);
    assert.equal(bought.body.player.gold, 60);
    assert.equal(bought.body.player.equippedFrame, "iron");
    assert.deepEqual(bought.body.newBadges.map((b) => b.id), ["framed"]);
    assert.equal((await api("POST", "/api/shop/iron/buy")).status, 409);

    assert.equal((await api("POST", "/api/shop/iron/equip")).body.equippedFrame, null);
    assert.equal((await api("POST", "/api/shop/iron/equip")).body.equippedFrame, "iron");

  });

  await t.test("two purchases of the same frame at once: only one goes through", race, async () => {
    await User.updateOne({ _id: playerId }, { gold: 60 });
    const results = await Promise.all([api("POST", "/api/shop/rune/buy"), api("POST", "/api/shop/rune/buy")]);
    assert.deepEqual(results.map((r) => r.status).sort(), [200, 409]);
    assert.equal((await api("GET", "/api/player")).body.player.gold, 0);
  });

  await t.test("badges endpoint lists all 19 with progress", async () => {
    const { badges, total, earned } = (await api("GET", "/api/badges")).body;
    assert.equal(total, 19);
    assert.ok(earned >= 5);
    const iron = badges.find((b) => b.id === "food-2");
    assert.deepEqual([iron.value, iron.target, iron.unlocked], [0, 5, false]);
    assert.ok(badges.find((b) => b.id === "first-blood").unlockedAt);
  });

  await t.test("activity feed is newest first with friendly times", async () => {
    const { activity } = (await api("GET", "/api/activity?limit=50")).body;
    assert.ok(activity.length > 5);
    assert.match(activity[0].time, /Just now|\d{1,2}:\d{2}[ap]m/);

    // Buying the first frame wrote a purchase and then a badge, so the badge is listed first.
    const bought = activity.findIndex((a) => a.title === 'Purchased the "Iron edge" frame');
    const framed = activity.findIndex((a) => a.title === 'Earned the "Framed" badge');
    assert.ok(framed >= 0 && bought > framed, "newest first");
    assert.equal(activity[bought].reward, "-40g");
    assert.equal(activity[bought].icon, "◆");
    const types = new Set(activity.map((a) => a.type));
    for (const type of ["quest", "levelup", "badge", "purchase"]) assert.ok(types.has(type), type);
    assert.equal((await api("GET", "/api/activity?limit=2")).body.activity.length, 2);
  });

  await t.test("weekly chart: six bars plus today", async () => {
    const week = (await api("GET", "/api/player/week")).body;
    assert.equal(week.bars.length, 6);
    assert.equal(week.today.day, "Today");
    assert.ok(week.today.count >= 5);
    assert.equal(week.today.value, 100); // capped
    assert.equal(week.total, week.weekDone + week.today.count);
  });

  await t.test("profile updates and settings", async () => {
    assert.equal((await api("PATCH", "/api/player", {})).status, 400);
    assert.equal((await api("PATCH", "/api/player", { email: "bad" })).status, 400);
    assert.equal((await api("PATCH", "/api/player", { settings: { sounds: "yes" } })).status, 400);
    assert.equal((await api("PATCH", "/api/player", { settings: { theme: true } })).status, 400);
    assert.equal((await api("PATCH", "/api/player", { timezone: "Mars/Olympus" })).status, 400);

    const res = await api("PATCH", "/api/player", { name: "Renamed Hero", settings: { sounds: true, reminders: false } });
    assert.equal(res.status, 200);
    assert.equal(res.body.player.name, "Renamed Hero");
    assert.deepEqual(res.body.player.settings, { reminders: false, streakAlerts: true, sounds: true });

    const other = await api("POST", "/api/auth/signup", {
      name: "Other Hero", email: `other-${email}`, password, timezone: "Asia/Kolkata",
    });
    assert.equal(other.body.player.timezone, "Asia/Kolkata");
    assert.equal((await api("PATCH", "/api/player", { email: `other-${email}` })).status, 409);
    await api("DELETE", "/api/player", undefined, other.body.token);
  });

  await t.test("deleting the account removes the player and their data", async () => {
    assert.equal((await api("DELETE", "/api/player")).status, 200);
    assert.equal((await api("POST", "/api/auth/login", { email, password })).status, 401);
    assert.equal(await Quest.countDocuments({ userId: playerId }), 0);
  });
});
