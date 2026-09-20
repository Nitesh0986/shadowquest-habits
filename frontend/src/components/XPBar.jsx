import useAnimateIn from "../hooks/useAnimateIn.js";
import { xpToNext } from "../lib/game-engine/xpCurve.js";

export default function XPBar({ level, xp }) {
  const cap = xpToNext(level);
  const ready = useAnimateIn();
  const percent = Math.min(100, (xp / cap) * 100);

  return (
    <div>
      <div className="xp-cap">
        <span>{xp.toLocaleString("en-US")} XP</span>
        <span>
          {cap.toLocaleString("en-US")} to lvl {level + 1}
        </span>
      </div>
      <div
        className="xp-track"
        role="progressbar"
        aria-label="Experience"
        aria-valuenow={xp}
        aria-valuemin={0}
        aria-valuemax={cap}
      >
        <div className="xp-fill" style={{ width: ready ? `${percent}%` : "0%" }} />
      </div>
    </div>
  );
}
