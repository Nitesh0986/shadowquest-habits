import Icon from "./icons.jsx";
import { CATEGORIES } from "../lib/game-engine/badges.js";

export default function QuestCard({ quest, onComplete }) {
  const { id, title, category, attribute, xp, gold, meta, overdue, done } = quest;
  const cat = CATEGORIES[category];

  return (
    <div className={"quest" + (overdue ? " overdue" : "") + (done ? " done" : "")}>
      <button
        type="button"
        className={"seal" + (done ? " checked" : "")}
        onClick={() => onComplete(id)}
        disabled={done}
        aria-label={done ? `${title} completed` : `Complete ${title}`}
      >
        {done ? "✓" : "◆"}
      </button>

      <div className="quest-main">
        <div className="qt">{title}</div>
        <div className="qm">
          {category !== "General" && (
            <span className="cat-chip" style={{ "--c": cat.color }}>
              <Icon name={cat.icon} size={13} strokeWidth={2} />
              {category}
            </span>
          )}
          <span className={"tag" + (overdue ? " danger" : "")}>{overdue ? "Overdue" : attribute}</span>
          <span>{meta}</span>
        </div>
      </div>

      <div className="qreward">
        +{xp} XP · {gold}g
      </div>
    </div>
  );
}
