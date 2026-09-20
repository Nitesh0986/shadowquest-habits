import { useState } from "react";
import { useGame } from "../context/GameContext.jsx";
import Avatar from "../components/Avatar.jsx";
import BadgeCard from "../components/BadgeCard.jsx";
import { BADGE_GROUPS } from "../lib/game-engine/badges.js";

export default function Profile() {
  const { player, badges, equipped } = useGame();
  const [tab, setTab] = useState("All");

  const earned = badges.filter((b) => b.unlocked).length;
  const groups = BADGE_GROUPS.filter((g) => tab === "All" || g.id === tab);

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title font-display">Profile</h1>
      </div>

      <div className="profile-grid">
        <div className="card">
          <div className="profile-avatar">
            <Avatar name={player.name} frame={equipped} size={116} />
          </div>
          <div className="profile-name font-display">{player.name}</div>
          <div className="profile-sub">
            Level {player.level} · Joined {player.joinedDaysAgo} days ago
          </div>

          <div className="stat-pair big">
            <span>Total quests done</span>
            <span className="v font-display">{player.totalDone}</span>
          </div>
          <div className="stat-pair big">
            <span>Longest streak</span>
            <span className="v cyan font-display">{player.longestStreak} days</span>
          </div>
          <div className="stat-pair big">
            <span>Badges earned</span>
            <span className="v font-display">
              {earned}
              <span className="v-of"> / {badges.length}</span>
            </span>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <h2>Badges</h2>
            <span className="count">{earned} of {badges.length} earned</span>
          </div>

          <div className="filters" role="group" aria-label="Filter badges">
            {["All", ...BADGE_GROUPS.map((g) => g.id)].map((id) => {
              const group = BADGE_GROUPS.find((g) => g.id === id);
              return (
                <button
                  key={id}
                  type="button"
                  className={"filter" + (tab === id ? " active" : "")}
                  style={group ? { "--c": group.color } : undefined}
                  onClick={() => setTab(id)}
                  aria-pressed={tab === id}
                >
                  {group && <span className="chip-dot" aria-hidden="true" />}
                  {group ? group.label : "All"}
                </button>
              );
            })}
          </div>

          {groups.map((group) => {
            const items = badges.filter((b) => b.group === group.id);
            const got = items.filter((b) => b.unlocked).length;
            return (
              <section key={group.id} className="badge-group" style={{ "--c": group.color }}>
                <header className="badge-group-head">
                  <h3 className="font-display">{group.label}</h3>
                  <span className="blurb">{group.blurb}</span>
                  <span className="count">
                    {got} / {items.length}
                  </span>
                </header>
                <ul className="badge-list">
                  {items.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
