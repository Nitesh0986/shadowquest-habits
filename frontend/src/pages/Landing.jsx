import { useState } from "react";
import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import PlusMark from "../components/PlusMark.jsx";
import useReveal from "../hooks/useReveal.js";
import heroWolf from "../assets/hero-wolf.jpg";
import poster from "../assets/poster.jpg";

const NAV = [
  { n: "01.", label: "DASHBOARD", to: "/dashboard" },
  { n: "02.", label: "QUEST_LOG", to: "/quests" },
  { n: "03.", label: "SHOP", to: "/shop" },
  { n: "04.", label: "PROFILE", to: "/profile" },
];

const VPOS = [12.6, 37.5, 61.9, 86.2];
const HPOS = [32.7, 71.4];

const ICONS = {
  quest: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M16 3 L27 9 V23 L16 29 L5 23 V9 Z" stroke="#3FD9EB" strokeWidth="1.3" strokeLinejoin="round" />
      <path d="M11 15.5 L14.5 19 L21.5 12" stroke="#3FD9EB" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  xp: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path d="M6 23 L6 17 M13 23 L13 12 M20 23 L20 8 M27 23 L27 15" stroke="#3FD9EB" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 24 H28" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
    </svg>
  ),
  streak: (
    <svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <path
        d="M16 4 C16 10 9 12 9 19 A7 7 0 0 0 23 19 C23 15 20 14 20 11 C20 14 17 15 17 18 C17 15.5 14.5 15 14.5 12.5 C14.5 9.5 16 8 16 4 Z"
        stroke="#3FD9EB"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

const NODES = [
  { icon: "quest", sq: { top: "27%", left: "60%", delay: 1500 }, lbl: { top: "11%", left: "26%", anim: "a-left", delay: 1100 }, title: "[ QUEST_ENGINE ]", desc: "Core system tracking every quest you create and complete." },
  { icon: "xp", sq: { top: "58%", left: "32%", delay: 1800 }, lbl: { top: "76%", left: "3%", anim: "a-left", delay: 1400 }, title: "[ XP_SYSTEM ]", desc: "Non-linear leveling engine converting effort into growth." },
  { icon: "streak", sq: { top: "63%", left: "50%", delay: 2100 }, lbl: { top: "50%", left: "78%", anim: "a-right", delay: 1700 }, title: "[ STREAK_SYNC ]", desc: "Keeps your daily momentum synced across every device." },
];

const CONNECTORS = [
  [38, 14, 52, 14, 1200],
  [52, 14, 60, 27, 1400],
  [32, 58, 20, 74, 1500],
  [20, 74, 6, 74, 1700],
  [78, 53, 63, 53, 1800],
  [63, 53, 50, 63, 2000],
];

const FEATURES = [
  { n: "01", title: "Quest engine", text: "Turn any task into a quest — tag it, set a difficulty, and let it feed your stats automatically." },
  { n: "02", title: "XP system", text: "A non-linear leveling curve — every level takes a little more than the last, so it never feels trivial." },
  { n: "03", title: "Streak sync", text: "Consecutive days build a streak that carries across devices, so momentum is never lost." },
  { n: "04", title: "Gold & shop", text: "Every quest pays out gold for avatar frames, and food, fitness, study and sleep quests earn you badges." },
];

const STEPS = [
  { n: "01", title: "Log a quest", text: "Add anything you need to do — gym, reading, chores — and tag it with the stat it should train." },
  { n: "02", title: "Complete it", text: "Mark it done the moment you finish. No waiting, no delayed logging." },
  { n: "03", title: "Earn XP & gold", text: "Rewards land instantly and roll straight into your character's stats." },
  { n: "04", title: "Level up", text: "Watch your bar fill, your stats climb, and your streak grow day over day." },
];

function MenuIcon({ path }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d={path} strokeLinecap="round" />
    </svg>
  );
}

function IdIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.5" aria-hidden="true">
      <path d="M4 4h16v16H4z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { isAuthed, player, logout } = useGame();
  useReveal();

  return (
    <div className="landing">
      <section className="lp-hero">
        <div className="lp-bg a-in" />
        <div
          className="lp-wolf a-in"
          style={{ animationDelay: "300ms", backgroundImage: `url(${heroWolf})` }}
          aria-hidden="true"
        />

        <div className="lp-content">
          <nav className="lp-nav" aria-label="Main">
            <span className="lp-wordmark font-display a-up" style={{ animationDelay: "200ms" }}>
              SHADOWQUEST
            </span>

            <div className="lp-navlinks">
              {NAV.map((item, i) => (
                <div key={item.to} className="lp-navitem a-up" style={{ animationDelay: `${350 + i * 100}ms` }}>
                  <span className="n">{item.n}</span>
                  <Link className="l" to={item.to}>
                    {item.label}
                  </Link>
                </div>
              ))}
            </div>

            <div className="lp-navright a-right" style={{ animationDelay: "600ms" }}>
              <IdIcon />
              <span className="txt">{isAuthed ? `HUNTER: ${(player?.name || 'HERO').toUpperCase()}` : "HUNTER_ID: GUEST"}</span>
              <span className="connected">[ ONLINE ]</span>
              <span className="status">STATUS:</span>
              <span className="lp-chip">LEVEL {player?.level || 1}</span>
              {isAuthed ? (
                <>
                  <Link className="lp-login" to="/dashboard">
                    DASHBOARD
                  </Link>
                  <button
                    type="button"
                    className="lp-login"
                    onClick={logout}
                    style={{ background: "none", cursor: "pointer", font: "inherit" }}
                  >
                    LOG_OUT
                  </button>
                </>
              ) : (
                <>
                  <Link className="lp-login" to="/login">
                    LOG_IN
                  </Link>
                  <Link className="lp-login" to="/signup" style={{ background: "var(--accent)", color: "#000", borderColor: "var(--accent)" }}>
                    SIGN_UP
                  </Link>
                </>
              )}
            </div>

            <button
              type="button"
              className={"lp-hamburger a-in" + (menuOpen ? " open" : "")}
              style={{ animationDelay: "400ms" }}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="menu-ic">
                <MenuIcon path="M3 6h18M3 12h18M3 18h18" />
              </span>
              <span className="x-ic">
                <MenuIcon path="M6 6l12 12M18 6L6 18" />
              </span>
            </button>
          </nav>

          <div className={"lp-menu" + (menuOpen ? " open" : "")}>
            <div className="lp-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="lp-panel">
              <button type="button" className="lp-panel-close" aria-label="Close menu" onClick={() => setMenuOpen(false)}>
                <MenuIcon path="M6 6l12 12M18 6L6 18" />
              </button>
              <div className="lp-panel-nav">
                {NAV.map((item, i) => (
                  <Link key={item.to} to={item.to} className="lp-panel-item" style={{ transitionDelay: `${150 + i * 75}ms` }}>
                    <span className="n">{item.n}</span>
                    <span className="l font-display">{item.label}</span>
                  </Link>
                ))}
                {isAuthed ? (
                  <>
                    <Link to="/settings" className="lp-panel-item" style={{ transitionDelay: "450ms" }}>
                      <span className="n">05.</span>
                      <span className="l font-display">SETTINGS</span>
                    </Link>
                    <button
                      type="button"
                      className="lp-panel-item"
                      onClick={() => { setMenuOpen(false); logout(); }}
                      style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}
                    >
                      <span className="n">06.</span>
                      <span className="l font-display" style={{ color: "#ff5555" }}>LOG_OUT</span>
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="lp-panel-item" style={{ transitionDelay: "450ms" }}>
                      <span className="n">05.</span>
                      <span className="l font-display">LOG_IN</span>
                    </Link>
                    <Link to="/signup" className="lp-panel-item" style={{ transitionDelay: "525ms" }}>
                      <span className="n">06.</span>
                      <span className="l font-display" style={{ color: "var(--accent)" }}>SIGN_UP</span>
                    </Link>
                  </>
                )}
              </div>
              <div className="lp-panel-wallet" style={{ transitionDelay: "600ms" }}>
                <div className="row1">
                  <IdIcon />
                  <span>{isAuthed ? `HUNTER: ${player?.name}` : "HUNTER_ID: GUEST"}</span>
                  <span className="connected">[ ONLINE ]</span>
                </div>
                <div className="row2">
                  <span>STATUS:</span>
                  <span className="lp-chip">LEVEL {player?.level || 1}</span>
                </div>
              </div>
            </div>
          </div>

          <h1 className="lp-h1 font-display a-up" style={{ animationDelay: "400ms" }}>
            Ordinary Days.
            <br />
            Extraordinary
            <br />
            Levels.
          </h1>

          <div className="lp-grid" aria-hidden="true">
            {VPOS.map((p, i) => (
              <div key={`v${i}`} className="vline a-grid-v" style={{ left: `${p}%`, animationDelay: `${600 + i * 100}ms` }} />
            ))}
            {HPOS.map((p, i) => (
              <div key={`h${i}`} className="hline a-grid-h" style={{ top: `${p}%`, animationDelay: `${800 + i * 150}ms` }} />
            ))}
            {HPOS.flatMap((hp, hi) =>
              VPOS.map((vp, vi) => (
                <PlusMark
                  key={`p${hi}-${vi}`}
                  className="a-scale"
                  style={{ top: `${hp}%`, left: `${vp}%`, animationDelay: `${1000 + (hi * 4 + vi) * 80}ms` }}
                />
              ))
            )}
          </div>

          <div className="lp-nodes" aria-hidden="true">
            {NODES.map((n) => (
              <div key={n.title}>
                <div className="node-sq a-scale" style={{ top: n.sq.top, left: n.sq.left, animationDelay: `${n.sq.delay}ms` }}>
                  <div className="node-icon" style={{ animationDelay: `${n.sq.delay + 250}ms` }}>
                    {ICONS[n.icon]}
                  </div>
                </div>
                <div className={`node-label ${n.lbl.anim}`} style={{ top: n.lbl.top, left: n.lbl.left, animationDelay: `${n.lbl.delay}ms` }}>
                  <span className="title font-display">{n.title}</span>
                  <p>{n.desc}</p>
                </div>
              </div>
            ))}
            {CONNECTORS.map(([x1, y1, x2, y2, delay]) => (
              <svg key={`${x1}-${y1}`} className="connector a-in" style={{ animationDelay: `${delay}ms` }}>
                <line x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`} stroke="rgba(255,255,255,0.25)" strokeWidth="1" vectorEffect="non-scaling-stroke" />
              </svg>
            ))}
          </div>

          <div className="lp-bottom">
            <Link to={isAuthed ? "/dashboard" : "/signup"} className="lp-cta a-up" style={{ animationDelay: "900ms" }}>
              <span className="star">✦</span>
              <span className="label">{isAuthed ? "Go to Campaign Dashboard" : "Begin your first quest"}</span>
            </Link>

            <div className="lp-infocard a-right" style={{ animationDelay: "1100ms" }}>
              <span className="badge">NOT A TO-DO LIST — A CAMPAIGN</span>
              <div className="body">
                <svg viewBox="0 0 280 168" preserveAspectRatio="none" aria-hidden="true">
                  <polygon points="0.5,0.5 279.5,0.5 279.5,167.5 30,167.5 0.5,137.5" fill="none" stroke="#3FD9EB" strokeWidth="1" vectorEffect="non-scaling-stroke" />
                </svg>
                <p>Every quest completed shapes your character sheet, XP bar, and streak — real progress that levels up over time.</p>
                <a href="#how-it-works">VIEW_HOW_IT_WORKS</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="lp-below">
        <section className="lp-section">
          <div className="lp-section-head reveal">
            <h2 className="font-display">Everything a real campaign needs</h2>
            <p>No fluff, no filler mechanics — just the systems that make daily effort feel like progress.</p>
          </div>
          <div className="lp-feat-grid">
            {FEATURES.map((f) => (
              <div key={f.n} className="lp-feat reveal">
                <div className="corner">
                  <div className="bh" />
                  <div className="bv" />
                </div>
                <span className="num">{f.n}</span>
                <h3 className="font-display">{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section" id="how-it-works">
          <div className="lp-section-head reveal">
            <h2 className="font-display">How it works</h2>
            <p>Four steps between a task on your mind and a stat point on your sheet.</p>
          </div>
          <div className="lp-steps">
            {STEPS.map((s) => (
              <div key={s.n} className="lp-step reveal">
                <div className="n font-display">{s.n}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
                <div className="stepline" />
              </div>
            ))}
          </div>
        </section>

        <section className="lp-section lp-poster-wrap">
          <div className="lp-poster reveal">
            <img src={poster} alt="Shadowquest poster: a wolf inside a teal seal with the words Solo Life, it's do or die" />
          </div>
        </section>

        <footer className="lp-foot">
          <div className="lp-foot-inner">
            <div className="lp-foot-brand font-display">SHADOWQUEST</div>
            <div className="lp-foot-links">
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/quests">Quest log</Link>
              <Link to="/shop">Shop</Link>
              <Link to="/profile">Profile</Link>
            </div>
            <div className="lp-foot-copy">© 2026 Shadowquest. Not a bank — a campaign.</div>
          </div>
        </footer>
      </main>
    </div>
  );
}
