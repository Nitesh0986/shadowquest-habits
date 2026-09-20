import BadgeMedal from "./BadgeMedal.jsx";
import Icon from "./icons.jsx";
import { groupOf } from "../lib/game-engine/badges.js";

// A badge with its name, how to earn it, and either progress or an "Earned" mark.
export default function BadgeCard({ badge, medalSize = 84 }) {
  const group = groupOf(badge);
  const percent = Math.round((badge.value / badge.target) * 100);

  return (
    <li className={"badge-card" + (badge.unlocked ? " earned" : " locked")} style={{ "--c": group.color }}>
      <BadgeMedal badge={badge} size={medalSize} />
      <div className="badge-text">
        <div className="badge-name">{badge.name}</div>
        <div className="badge-hint">{badge.hint}</div>
        {badge.unlocked ? (
          <div className="badge-earned">
            <Icon name="check" size={13} strokeWidth={2.4} />
            Earned
          </div>
        ) : (
          <>
            <div className="badge-bar" aria-hidden="true">
              <i style={{ width: `${percent}%` }} />
            </div>
            <div className="badge-progress">
              {badge.value} / {badge.target}
            </div>
          </>
        )}
      </div>
    </li>
  );
}
