import { Link } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import useAnimateIn from "../hooks/useAnimateIn.js";
import XPBar from "../components/XPBar.jsx";
import AttributeRow from "../components/AttributeRow.jsx";
import QuestCard from "../components/QuestCard.jsx";
import BadgeMedal from "../components/BadgeMedal.jsx";
import { groupOf } from "../lib/game-engine/badges.js";
import { ATTRIBUTES } from "../data/constants.js";

export default function Dashboard() {
  const { player, quests, activity, badges, week, completeQuest } = useGame();
  const ready = useAnimateIn();

  const todays = quests.filter((q) => q.dueToday);
  const remaining = todays.filter((q) => !q.done).length;
  // Finished today specifically — the list above now also includes older
  // finished quests, so "done" alone would over-count.
  const doneToday = quests.filter((q) => q.doneToday).length;
  const weekTotal = player.weekDone + doneToday;
  const todayBar = Math.min(100, doneToday * 20);

  // The three locked badges you are closest to earning.
  const nextBadges = badges
    .filter((b) => !b.unlocked)
    .sort((a, b) => b.value / b.target - a.value / a.target || a.target - b.target)
    .slice(0, 3);

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title font-display">
            Level {player.level} — {player.name}
          </h1>
          <div className="sub">
            {date} · {todays.length} {todays.length === 1 ? "quest" : "quests"} today
          </div>
        </div>
        <div className="level-badge font-display">LEVEL {player.level}</div>
      </div>

      {player.streakAtRisk && (
        <div className="risk-banner">
          <div className="dot" />
          <span>
            Your {player.streak}-day streak is at risk — complete a quest before midnight to keep it alive.
          </span>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <XPBar level={player.level} xp={player.xp} />

          {ATTRIBUTES.map((name) => (
            <AttributeRow key={name} name={name} value={player.attrs[name]} />
          ))}

          <div className="divider" />
          <div className="stat-pair">
            <span>Gold</span>
            <span className="v cyan font-display">{player.gold}</span>
          </div>
          <div className="stat-pair">
            <span>Current streak</span>
            <span className="v red font-display">{player.streak} days</span>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-head">
              <h2>Today's quests</h2>
              {remaining > 0 && <span className="count">{remaining} remaining</span>}
            </div>

            {todays.map((quest) => (
              <QuestCard key={quest.id} quest={quest} onComplete={completeQuest} />
            ))}

            {remaining === 0 && (
              <div className="empty">
                <div className="big">✦</div>
                All quests cleared. <Link to="/quests">Add a new one</Link> to keep the streak going.
              </div>
            )}
          </div>

          {nextBadges.length > 0 && (
            <div className="card spaced">
              <div className="card-head">
                <h2>Badges to earn next</h2>
                <Link to="/profile" className="count link">
                  See all badges
                </Link>
              </div>
              <ul className="next-badges">
                {nextBadges.map((b) => (
                  <li key={b.id} className="next-badge" style={{ "--c": groupOf(b).color }}>
                    <BadgeMedal badge={b} size={52} />
                    <div className="next-text">
                      <div className="badge-name">{b.name}</div>
                      <div className="badge-hint">{b.hint}</div>
                      <div className="badge-bar" aria-hidden="true">
                        <i style={{ width: `${(b.value / b.target) * 100}%` }} />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card spaced">
            <div className="card-head">
              <h2>This week</h2>
              <span className="count">{weekTotal} quests completed</span>
            </div>
            <div className="week-chart">
              {week.bars.map((bar) => (
                <div key={bar.date ?? bar.day} className="week-bar-wrap">
                  <div className="week-bar">
                    <div className="week-bar-fill" style={{ height: ready ? `${bar.value}%` : "0%" }} />
                  </div>
                  <div className="week-label">{bar.day}</div>
                </div>
              ))}
              <div className="week-bar-wrap">
                <div className="week-bar">
                  <div className="week-bar-fill today" style={{ height: ready ? `${todayBar}%` : "0%" }} />
                </div>
                <div className="week-label">Today</div>
              </div>
            </div>
          </div>

          <div className="card spaced">
            <div className="card-head">
              <h2>Recent activity</h2>
            </div>
            <div className="activity">
              {activity.map((row) => (
                <div key={row.id} className="activity-row">
                  <div className="activity-icon">{row.icon}</div>
                  <div className="activity-body">
                    <div className="t1">{row.title}</div>
                    <div className="t2">{row.time}</div>
                  </div>
                  <div className="activity-xp">{row.reward}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
