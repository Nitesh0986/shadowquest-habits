import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { InsufficientGoldModal, LevelUpModal } from "../components/CelebrationModal.jsx";
import {
  loadStoredData,
  saveStoredData,
  initSession,
  clearSession,
  deleteLocalAccount,
  applyLazyResets,
  formatQuest,
  formatPlayer,
  computeWeek,
  formatShop,
  formatBadges,
  formatActivity,
} from "../lib/game-engine/localStore.js";
import { dayKey } from "../lib/game-engine/dates.js";
import { applyCompletion } from "../lib/game-engine/streak.js";
import { newlyUnlocked } from "../lib/game-engine/badges.js";
import { addXp } from "../lib/game-engine/xpCurve.js";
import { rewardFor } from "../lib/game-engine/economy.js";
import { getFrame } from "../lib/game-engine/frames.js";

const GameContext = createContext(null);

const emptyWeek = { bars: [], today: { day: "Today", count: 0, value: 0 }, weekDone: 0, total: 0 };
const TOKEN_KEY = "shadowquest_token";

export function GameProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [rawPlayer, setRawPlayer] = useState(null);
  const [rawQuests, setRawQuests] = useState([]);
  const [rawActivity, setRawActivity] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [ready, setReady] = useState(false);
  const [goldModalItem, setGoldModalItem] = useState(null);
  const [levelUpModalLevel, setLevelUpModalLevel] = useState(null);
  const nextId = useRef(100);

  function id() {
    nextId.current += 1;
    return nextId.current;
  }

  function toast(text, kind = "success", badge = null) {
    const toastId = id();
    const duration = kind === "badge" ? 4400 : 2600;
    setToasts((list) => [...list, { id: toastId, text, kind, badge }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== toastId)), duration);
  }

  function announceBadges(newBadges = []) {
    newBadges.forEach((badge) => toast(`Badge unlocked: ${badge.name}`, "badge", badge));
  }

  function resetGameState() {
    setRawPlayer(null);
    setRawQuests([]);
    setRawActivity([]);
    setGoldModalItem(null);
    setLevelUpModalLevel(null);
  }

  // Load session on startup
  useEffect(() => {
    if (!token) {
      resetGameState();
      setReady(true);
      return;
    }

    const data = loadStoredData();
    if (!data.player) {
      // Initialize with demo user if token is present but data was cleared
      const seeded = initSession("demo@shadowquest.test", "Aris Hollow");
      setRawPlayer(seeded.player);
      setRawQuests(seeded.quests);
      setRawActivity(seeded.activity);
    } else {
      const tz = data.player.timezone || "UTC";
      const resetQuests = applyLazyResets(data.quests, tz);
      setRawPlayer(data.player);
      setRawQuests(resetQuests);
      setRawActivity(data.activity);
      saveStoredData({ quests: resetQuests });
    }
    setReady(true);
  }, [token]);

  // Derived state for the UI
  const tz = rawPlayer?.timezone || "UTC";
  const player = rawPlayer ? formatPlayer(rawPlayer, rawActivity) : null;
  const quests = rawQuests.map((q) => formatQuest(q, tz));
  const activity = formatActivity(rawActivity, tz);
  const badges = formatBadges(rawPlayer);
  const shopItems = formatShop(rawPlayer);
  const week = rawPlayer ? computeWeek(rawActivity, tz) : emptyWeek;

  // Actions
  function signup({ name, email, password }) {
    const seeded = initSession(email, name);
    setRawPlayer(seeded.player);
    setRawQuests(seeded.quests);
    setRawActivity(seeded.activity);
    localStorage.setItem(TOKEN_KEY, "session_active");
    setToken("session_active");
    toast(`Welcome, ${name}!`);
  }

  function login({ email, password }) {
    const data = loadStoredData();
    let p = data.player;
    let q = data.quests;
    let a = data.activity;

    if (!p || (email && p.email !== email)) {
      const seeded = initSession(email || "demo@shadowquest.test", "Aris Hollow");
      p = seeded.player;
      q = seeded.quests;
      a = seeded.activity;
    }

    setRawPlayer(p);
    setRawQuests(q);
    setRawActivity(a);
    localStorage.setItem(TOKEN_KEY, "session_active");
    setToken("session_active");
    toast(`Welcome back, ${p.name}!`);
  }

  function logout() {
    clearSession();
    setToken(null);
    resetGameState();
  }

  function deleteAccount() {
    deleteLocalAccount();
    logout();
  }

  function completeQuest(questId) {
    const targetQuest = rawQuests.find((q) => q.id === questId);
    if (!targetQuest || targetQuest.done || !rawPlayer) return;

    const today = dayKey(new Date(), tz);
    const reward = rewardFor(targetQuest.difficulty);
    const xpOutcome = addXp(rawPlayer.level, rawPlayer.xp, reward.xp);

    const prevCategoryDone = rawPlayer.catDone?.[targetQuest.category] ?? 0;
    const prevAttr = rawPlayer.attrs?.[targetQuest.attribute] ?? 0;
    const streakUpdate = applyCompletion(rawPlayer, today);

    const nextPlayer = {
      ...rawPlayer,
      level: xpOutcome.level,
      xp: xpOutcome.xp,
      gold: (rawPlayer.gold ?? 0) + reward.gold,
      totalDone: (rawPlayer.totalDone ?? 0) + 1,
      streak: streakUpdate.streak,
      longestStreak: streakUpdate.longestStreak,
      lastCompletedDate: streakUpdate.lastCompletedDate,
      attrs: {
        ...rawPlayer.attrs,
        [targetQuest.attribute]: prevAttr + 1,
      },
      catDone: {
        ...rawPlayer.catDone,
        [targetQuest.category]: prevCategoryDone + 1,
      },
    };

    const nextQuests = rawQuests.map((q) =>
      q.id === questId
        ? {
            ...q,
            done: true,
            completedDay: today,
            completedAt: new Date().toISOString(),
          }
        : q
    );

    const newActivities = [
      {
        id: `act_${Date.now()}_q`,
        type: "quest",
        title: targetQuest.title,
        reward: `+${reward.xp} XP · +${reward.gold}g`,
        day: today,
        createdAt: new Date().toISOString(),
      },
    ];

    if (xpOutcome.leveledUp) {
      newActivities.push({
        id: `act_${Date.now()}_lvl`,
        type: "levelup",
        title: `Reached Level ${xpOutcome.level}!`,
        reward: "Stat Boost",
        day: today,
        createdAt: new Date().toISOString(),
      });
    }

    const unlockedBadges = newlyUnlocked(
      { player: rawPlayer, owned: rawPlayer.ownedFrames || [] },
      { player: nextPlayer, owned: nextPlayer.ownedFrames || [] }
    );

    unlockedBadges.forEach((b, i) => {
      newActivities.push({
        id: `act_${Date.now()}_b_${i}`,
        type: "badge",
        title: `Earned ${b.name}`,
        reward: b.hint,
        day: today,
        createdAt: new Date().toISOString(),
      });
    });

    const nextActivity = [...newActivities, ...rawActivity];

    setRawPlayer(nextPlayer);
    setRawQuests(nextQuests);
    setRawActivity(nextActivity);
    saveStoredData({ player: nextPlayer, quests: nextQuests, activity: nextActivity });

    toast(`+${reward.xp} XP · +${reward.gold}g`);
    if (xpOutcome.leveledUp) {
      toast(`Level up — you're now level ${xpOutcome.level}`);
      setLevelUpModalLevel(xpOutcome.level);
    }
    announceBadges(unlockedBadges);
  }

  function addQuest(form) {
    if (!rawPlayer) return;
    const newQuest = {
      id: `q_${Date.now()}`,
      title: form.title,
      category: form.category || "Study",
      attribute: form.attribute || "Intellect",
      difficulty: form.difficulty || "Normal",
      repeat: form.repeat || "Daily quest",
      dueDate: form.dueDate || null,
      done: false,
      completedDay: null,
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    const nextQuests = [newQuest, ...rawQuests];
    setRawQuests(nextQuests);
    saveStoredData({ quests: nextQuests });
    toast("Quest added");
  }

  function purchase(itemId) {
    const frame = getFrame(itemId);
    if (!frame || !rawPlayer) return;

    if (rawPlayer.gold < frame.price) {
      setGoldModalItem(frame);
      return;
    }

    const owned = rawPlayer.ownedFrames || [];
    if (owned.includes(itemId)) {
      equipFrame(itemId);
      return;
    }

    const nextOwned = [...owned, itemId];
    const today = dayKey(new Date(), tz);
    const nextPlayer = {
      ...rawPlayer,
      gold: rawPlayer.gold - frame.price,
      ownedFrames: nextOwned,
      equippedFrame: itemId,
    };

    const unlockedBadges = newlyUnlocked(
      { player: rawPlayer, owned },
      { player: nextPlayer, owned: nextOwned }
    );

    const newActivity = [
      {
        id: `act_${Date.now()}_buy`,
        type: "purchase",
        title: `Bought ${frame.name}`,
        reward: `-${frame.price}g`,
        day: today,
        createdAt: new Date().toISOString(),
      },
      ...rawActivity,
    ];

    setRawPlayer(nextPlayer);
    setRawActivity(newActivity);
    saveStoredData({ player: nextPlayer, activity: newActivity });

    toast(`${frame.name} purchased and equipped`);
    announceBadges(unlockedBadges);
  }

  function equipFrame(itemId) {
    if (!rawPlayer) return;
    const isEquipped = rawPlayer.equippedFrame === itemId;
    const nextPlayer = {
      ...rawPlayer,
      equippedFrame: isEquipped ? null : itemId,
    };

    setRawPlayer(nextPlayer);
    saveStoredData({ player: nextPlayer });
    toast(isEquipped ? "Frame removed" : "Frame equipped");
  }

  function updatePlayer(changes) {
    if (!rawPlayer) return;
    const nextPlayer = { ...rawPlayer, ...changes };
    setRawPlayer(nextPlayer);
    saveStoredData({ player: nextPlayer });
  }

  function toggleSetting(key) {
    if (!rawPlayer) return;
    const current = rawPlayer.settings?.[key] ?? false;
    const nextPlayer = {
      ...rawPlayer,
      settings: {
        ...rawPlayer.settings,
        [key]: !current,
      },
    };
    setRawPlayer(nextPlayer);
    saveStoredData({ player: nextPlayer });
    toast("Setting updated");
  }

  const value = {
    ready,
    isAuthed: Boolean(token),
    player,
    quests,
    activity,
    badges,
    shopItems,
    week,
    owned: player?.ownedFrames ?? [],
    equipped: player?.equippedFrame ?? null,
    settings: player?.settings ?? { reminders: true, streakAlerts: true, sounds: false },
    toasts,
    signup,
    login,
    logout,
    deleteAccount,
    completeQuest,
    addQuest,
    purchase,
    equipFrame,
    updatePlayer,
    toggleSetting,
    triggerLevelUpDemo: (lvl) => setLevelUpModalLevel(lvl || player?.level || 2),
  };

  return (
    <GameContext.Provider value={value}>
      {children}
      {goldModalItem && (
        <InsufficientGoldModal
          item={goldModalItem}
          currentGold={player?.gold ?? 0}
          onClose={() => setGoldModalItem(null)}
        />
      )}
      {levelUpModalLevel && (
        <LevelUpModal
          level={levelUpModalLevel}
          onClose={() => setLevelUpModalLevel(null)}
        />
      )}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used inside <GameProvider>");
  return ctx;
}
