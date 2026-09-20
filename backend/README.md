# ShadowQuest backend

Express + MongoDB (Mongoose) API for the ShadowQuest frontend. It lives in its own folder and is **not merged into the frontend yet**: run it in one terminal, run the Vite frontend in another, and test the API directly with curl, Postman or Thunder Client.

## Run it

You need Node 18.18+ and a MongoDB (local `mongod`, or a free Atlas cluster).

```bash
cd backend
npm install
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm run seed                # optional: demo@shadowquest.test / password123 with a few quests
npm run dev                 # http://localhost:5000  (npm start for no auto-restart)
```

Check it is alive: `http://localhost:5000/api/health`

| .env | What it does |
|---|---|
| `MONGO_URI` | Your MongoDB connection string |
| `JWT_SECRET` | Long random string used to sign login tokens |
| `PORT` | Default 5000 |
| `CLIENT_ORIGIN` | Frontend address allowed by CORS. Default `http://localhost:5173` (comma-separate several) |
| `DEFAULT_TIMEZONE` | Timezone for new accounts that don't send one. Default `UTC` |

**Timezone matters.** "Today", streaks and daily-quest resets are worked out in the player's own timezone. Send `"timezone": "Asia/Kolkata"` (any IANA name) when signing up, or `PATCH /api/player` later. From the browser: `Intl.DateTimeFormat().resolvedOptions().timeZone`.

## Try it in a terminal

```bash
# sign up (returns a token)
curl -s -X POST localhost:5000/api/auth/signup -H 'Content-Type: application/json' \
  -d '{"name":"Aris Hollow","email":"aris@example.com","password":"password123","timezone":"Asia/Kolkata"}'

TOKEN=paste-the-token-here

# add a quest, then complete it
curl -s -X POST localhost:5000/api/quests -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"title":"Read 20 pages","category":"Study","attribute":"Intellect","difficulty":"Normal","repeat":"Daily quest"}'

curl -s -X POST localhost:5000/api/quests/QUEST_ID/complete -H "Authorization: Bearer $TOKEN"
```

Every route except signup, login and health needs `Authorization: Bearer <token>`.

## Endpoints

| | Route | What it does |
|---|---|---|
| Auth | `POST /api/auth/signup` | `{ name, email, password, timezone? }` → `{ token, player }` |
| | `POST /api/auth/login` | `{ email, password }` → `{ token, player }` |
| | `GET /api/auth/me` | Restore a session from the stored token → `{ player }` |
| Quests | `GET /api/quests` | Optional `?category=Food&status=active\|done\|overdue&scope=today` → `{ quests }` |
| | `POST /api/quests` | `{ title, category, attribute, difficulty, repeat, dueDate? }` → `{ quest }` |
| | `PATCH /api/quests/:id` | Edit an unfinished quest |
| | `DELETE /api/quests/:id` | → `{ id }` |
| | `POST /api/quests/:id/complete` | → `{ player, quest, reward, leveledUp, newLevel, newBadges }` |
| Player | `GET /api/player` | → `{ player }` |
| | `PATCH /api/player` | `{ name?, email?, timezone?, settings? }` (settings: `reminders`, `streakAlerts`, `sounds`) |
| | `DELETE /api/player` | Deletes the account, its quests and its activity |
| | `GET /api/player/week` | → `{ bars, today, weekDone, total }` for the dashboard chart |
| Shop | `GET /api/shop` | → `{ gold, equippedFrame, items }` (each item has `owned`, `equipped`) |
| | `POST /api/shop/:frameId/buy` | Buys and equips → `{ player, item, newBadges }` |
| | `POST /api/shop/:frameId/equip` | Wear it; call again on the worn frame to take it off |
| Badges | `GET /api/badges` | All 19 with `value`, `target`, `unlocked`, `unlockedAt` |
| Activity | `GET /api/activity?limit=6` | Newest first, default 10, max 50 |

Errors always look like `{ "message": "Not enough gold. You need 150g more.", "code": "INSUFFICIENT_GOLD", "needed": 150 }`. Status codes: 400 bad input, 401 not signed in, 403 not owned, 404 not found, 409 already done / already owned / email taken.

## What `complete` does

1. Claims the quest in one atomic step (`done: false` → `true`), so two clicks or two tabs can never pay out twice.
2. Adds XP and rolls over into new levels (`xpToNext(level) = 20L² + 100L + 260`).
3. Adds gold, +1 to the quest's stat, +1 to its category count, +1 to total done.
4. Updates the streak from `lastCompletedDate`.
5. Unlocks any newly earned badges.
6. Writes activity rows (quest, level-up, badges).
7. Returns everything the toasts need.

If the player update fails, the quest is handed back rather than lost. Player changes use optimistic concurrency, so two requests changing the same player at once retry instead of overwriting each other.

## Rules worth knowing

- **Rewards** come from difficulty: Easy 15 XP / 3g, Normal 30 / 6, Hard 50 / 10, Epic 80 / 16. A new player starts at level 1 with 0 XP and 0 gold.
- **Streak** goes up by 1 for the first quest of each day, carries on if yesterday had one, resets to 1 after a missed day. `streakAtRisk` is `true` when the last quest was yesterday and none is done yet today. A streak that has already lapsed is reported as 0.
- **Repeating quests** reset lazily: a finished Daily quest is open again the next day, a Weekly one on Monday. Nothing runs at midnight.
- **Overdue** = a one-time quest with a `dueDate` before today that isn't done.
- **`dueToday`** is what the dashboard's "Today's quests" list should show: open quests that are due (or have no due date), plus anything finished today.
- **Week chart:** six bars for the six days before today plus a Today bar, each quest worth 20% up to 100%. It's built from activity rows, so history survives a Daily quest resetting.
- **Frames** are defined in `data/frames.js` (ids match `Avatar.jsx`). **Badges** are defined in `game-engine/badges.js`, a straight copy of the frontend file.
- `repeat` is stored as `One-time`, `Daily` or `Weekly`. The frontend's `"Daily quest"` is accepted, and `meta` still comes back as `"Daily quest"`.

## Folder layout

```
backend/
├── server.js, app.js
├── config/         env.js, db.js
├── models/         User.js, Quest.js, Activity.js
├── routes/         one file per area
├── controllers/    one file per route file
├── middleware/     authMiddleware.js, errorHandler.js, validateObjectId.js
├── services/       playerService.js (safe player updates, badges, activity, weekly counts)
├── game-engine/    xpCurve.js, economy.js, badges.js (copied), streak.js, constants.js (new)
├── data/           frames.js
├── utils/          dates.js, serialize.js, AppError.js, asyncHandler.js
├── scripts/        seed.js
└── tests/
```

## Tests

```bash
npm test                                                             # game rules only, no database needed
TEST_MONGO_URI=mongodb://127.0.0.1:27017/shadowquest_test npm test   # plus the full API walkthrough
```

The API test creates its own throwaway player and deletes it at the end. Three tests fire requests at the same moment (double-complete, double-buy); they rely on MongoDB applying a filtered update atomically, which real MongoDB and Atlas do. If you ever point the tests at a lightweight MongoDB emulator, add `SKIP_RACE_TESTS=1`.

## For the merge later

| Frontend (`GameContext.jsx`) | Becomes |
|---|---|
| `Auth.jsx` submit | `POST /api/auth/signup` or `/login`, keep `token`, send it as `Authorization: Bearer` on every Axios call |
| page load | `GET /api/player`, `/api/quests`, `/api/badges`, `/api/activity?limit=6`, `/api/player/week`, `/api/shop` |
| `completeQuest(id)` | `POST /api/quests/:id/complete`, then toast from `reward`, `leveledUp`/`newLevel`, `newBadges` |
| `addQuest(form)` | `POST /api/quests` with the form as it is |
| `purchase(id)` / `equipFrame(id)` | `POST /api/shop/:id/buy` / `/equip` |
| Settings toggles, name, email | `PATCH /api/player` |

Three small frontend changes to expect: the dashboard's `doneToday` should count quests where `doneToday` is true (the list now includes older finished quests); `player.weekDone` already excludes today, so `weekDone + today` still works; and the weekly bars come from `/api/player/week` instead of `weekBars`.
