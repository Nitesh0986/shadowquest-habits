import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import api, { TOKEN_KEY, AUTH_EXPIRED_EVENT, apiMessage } from "../api/client.js";
import { InsufficientGoldModal, LevelUpModal } from "../components/CelebrationModal.jsx";

const GameContext = createContext(null);

const emptyWeek = { bars: [], today: { day: "Today", count: 0, value: 0 }, weekDone: 0, total: 0 };

export function GameProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [player, setPlayer] = useState(null);
  const [quests, setQuests] = useState([]);
  const [activity, setActivity] = useState([]);
  const [badges, setBadges] = useState([]);
  const [shopItems, setShopItems] = useState([]);
  const [week, setWeek] = useState(emptyWeek);
  const [toasts, setToasts] = useState([]);
  const [ready, setReady] = useState(false); // finished checking for a stored session
  const [goldModalItem, setGoldModalItem] = useState(null);
  const [levelUpModalLevel, setLevelUpModalLevel] = useState(null);
  const nextId = useRef(100);
  const pendingPatch = useRef({});
  const patchTimer = useRef(null);

  function id() {
    nextId.current += 1;
    return nextId.current;
  }

  function toast(text, kind = "success", badge = null) {
    const toastId = id();
    // Badge toasts stay a little longer so there is time to see the medal.
    const duration = kind === "badge" ? 4400 : 2600;
    setToasts((list) => [...list, { id: toastId, text, kind, badge }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== toastId)), duration);
  }

  function announceBadges(newBadges = []) {
    newBadges.forEach((badge) => toast(`Badge unlocked: ${badge.name}`, "badge", badge));
  }

  function resetGameState() {
    setPlayer(null);
    setQuests([]);
    setActivity([]);
    setBadges([]);
    setShopItems([]);
    setWeek(emptyWeek);
    setGoldModalItem(null);
    setLevelUpModalLevel(null);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    resetGameState();
  }

  // Everything the app needs after signing in or restoring a session.
  const loadAll = useCallback(async () => {
    const [p, q, s, b, a, w] = await Promise.all([
      api.get("/player"),
      api.get("/quests"),
      api.get("/shop"),
      api.get("/badges"),
      api.get("/activity?limit=6"),
      api.get("/player/week"),
    ]);
    setPlayer(p.data.player);
    setQuests(q.data.quests);
    setShopItems(s.data.items);
    setBadges(b.data.badges);
    setActivity(a.data.activity);
    setWeek(w.data);
  }, []);

  // Lighter refresh after an action that only moves badges/activity/the week
  // chart, not the whole page (the action itself already updated player/quests).
  const refreshSideEffects = useCallback(async () => {
    try {
      const [b, a, w] = await Promise.all([
        api.get("/badges"),
        api.get("/activity?limit=6"),
        api.get("/player/week"),
      ]);
      setBadges(b.data.badges);
      setActivity(a.data.activity);
      setWeek(w.data);
    } catch {
      // Non-critical — the next full reload will catch it back up.
    }
  }, []);

  // On mount (and whenever the token changes), restore or clear the session.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        resetGameState();
        setReady(true);
        return;
      }
      try {
        await loadAll();
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        if (!cancelled) setToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // A token can also expire mid-session (see api/client.js's response interceptor).
  useEffect(() => {
    window.addEventListener(AUTH_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(AUTH_EXPIRED_EVENT, logout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signup({ name, email, password }) {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const { data } = await api.post("/auth/signup", { name, email, password, timezone });
    localStorage.setItem(TOKEN_KEY, data.token);
    setPlayer(data.player);
    setToken(data.token); // triggers loadAll() for quests/badges/shop/activity/week
  }

  async function login({ email, password }) {
    const { data } = await api.post("/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, data.token);
    setPlayer(data.player);
    setToken(data.token);
  }

  async function deleteAccount() {
    await api.delete("/player");
    logout();
  }

  async function completeQuest(questId) {
    try {
      const { data } = await api.post(`/quests/${questId}/complete`);
      setQuests((list) => list.map((q) => (q.id === data.quest.id ? data.quest : q)));
      setPlayer(data.player);

      toast(`+${data.reward.xp} XP · +${data.reward.gold}g`);
      if (data.leveledUp) {
        toast(`Level up — you're now level ${data.newLevel}`);
        setLevelUpModalLevel(data.newLevel || data.player.level);
      }
      announceBadges(data.newBadges);

      refreshSideEffects();
    } catch (err) {
      toast(apiMessage(err, "Couldn't complete that quest."), "error");
    }
  }

  async function addQuest(form) {
    try {
      const { data } = await api.post("/quests", form);
      setQuests((list) => [data.quest, ...list]);
      toast("Quest added");
    } catch (err) {
      toast(apiMessage(err, "Couldn't add that quest."), "error");
    }
  }

  async function purchase(itemId) {
    const item = shopItems.find((i) => i.id === itemId);
    if (item && player && player.gold < item.price) {
      setGoldModalItem(item);
      return;
    }

    try {
      const { data } = await api.post(`/shop/${itemId}/buy`);
      setPlayer(data.player);
      setShopItems((list) => list.map((i) => (i.id === itemId ? data.item : { ...i, equipped: false })));
      toast(`${data.item.name} purchased and equipped`);
      announceBadges(data.newBadges);
      refreshSideEffects();
    } catch (err) {
      if (err?.response?.data?.code === "INSUFFICIENT_GOLD" && item) {
        setGoldModalItem(item);
      } else {
        toast(apiMessage(err, "Couldn't buy that frame."), "error");
      }
    }
  }

  // Click a worn frame again to take it off.
  async function equipFrame(itemId) {
    try {
      const { data } = await api.post(`/shop/${itemId}/equip`);
      setPlayer((p) => (p ? { ...p, equippedFrame: data.equippedFrame } : p));
      setShopItems((list) => list.map((i) => ({ ...i, equipped: i.id === data.equippedFrame })));
    } catch (err) {
      toast(apiMessage(err, "Couldn't equip that frame."), "error");
    }
  }

  // Name/email fields call this on every keystroke, same as the old dummy version,
  // so this debounces the actual PATCH instead of firing one per character.
  function updatePlayer(changes) {
    setPlayer((p) => (p ? { ...p, ...changes } : p));
    pendingPatch.current = { ...pendingPatch.current, ...changes };
    clearTimeout(patchTimer.current);
    patchTimer.current = setTimeout(async () => {
      const body = pendingPatch.current;
      pendingPatch.current = {};
      if (!Object.keys(body).length) return;
      try {
        const { data } = await api.patch("/player", body);
        setPlayer(data.player);
      } catch (err) {
        // Likely a mid-typing invalid value (e.g. an incomplete email) — the
        // next pause sends the full value, so only surface a real failure.
        if (err?.response?.status !== 400) toast(apiMessage(err, "Couldn't save your changes."), "error");
      }
    }, 600);
  }

  async function toggleSetting(key) {
    const value = !player?.settings?.[key];
    setPlayer((p) => (p ? { ...p, settings: { ...p.settings, [key]: value } } : p));
    try {
      const { data } = await api.patch("/player", { settings: { [key]: value } });
      setPlayer(data.player);
    } catch (err) {
      toast(apiMessage(err, "Couldn't save that setting."), "error");
    }
  }

  const value = {
    ready,
    isAuthed: !!token,
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

