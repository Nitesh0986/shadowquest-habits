import { useId } from "react";
import { IconPaths } from "./icons.jsx";
import { groupOf } from "../lib/game-engine/badges.js";

// A medal is read in three quick steps:
//   shape  -> which group it belongs to (circle Food, hexagon Fitness, shield Study,
//             diamond Sleep, starburst Milestones)
//   colour -> the same group, again
//   icon   -> which badge it is
// Tier (1-3) shows as pips under the medal. Locked medals drop to grey with a padlock.

const CX = 48;
const CY = 48;

function sealPoints() {
  // 10-spike starburst
  const pts = [];
  for (let i = 0; i < 20; i++) {
    const r = i % 2 === 0 ? 46 : 40;
    const a = (Math.PI * 2 * i) / 20 - Math.PI / 2;
    pts.push(`${(CX + r * Math.cos(a)).toFixed(2)},${(CY + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function ShapeEl({ shape, ...props }) {
  switch (shape) {
    case "circle":
      return <circle cx={CX} cy={CY} r="42" {...props} />;
    case "hex":
      return <polygon points="48,4 86.1,26 86.1,70 48,92 9.9,70 9.9,26" {...props} />;
    case "shield":
      return <path d="M48 4 84 15v32c0 21-16 37-36 45C28 84 12 68 12 47V15Z" {...props} />;
    case "diamond":
      return <polygon points="48,3 93,48 48,93 3,48" {...props} />;
    default:
      return <polygon points={sealPoints()} {...props} />;
  }
}

export default function BadgeMedal({ badge, size = 88 }) {
  const gid = useId().replace(/:/g, "");
  const group = groupOf(badge);
  const on = badge.unlocked;
  const color = on ? group.color : "#7d818c";
  const pipY = 100;
  const height = badge.tier ? 108 : 96; // milestones have no tier pips, so no room is reserved for them

  return (
    <svg
      className={"medal" + (on ? " earned" : " locked")}
      width={size}
      height={(size * height) / 96}
      viewBox={`0 0 96 ${height}`}
      role="img"
      aria-label={`${badge.name} badge, ${on ? "earned" : "locked"}`}
      style={on ? { filter: `drop-shadow(0 0 9px ${group.color}44)` } : undefined}
    >
      <defs>
        <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={group.color} stopOpacity="0.34" />
          <stop offset="1" stopColor={group.color} stopOpacity="0.06" />
        </linearGradient>
      </defs>

      {/* body */}
      <ShapeEl shape={group.shape} fill={on ? `url(#fill-${gid})` : "#ffffff"} fillOpacity={on ? 1 : 0.03} stroke={color} strokeOpacity={on ? 1 : 0.35} strokeWidth="2.2" strokeLinejoin="round" />

      {/* inner rim */}
      <g transform={`translate(${CX} ${CY}) scale(0.8) translate(${-CX} ${-CY})`}>
        <ShapeEl shape={group.shape} fill="none" stroke={color} strokeOpacity={on ? 0.4 : 0.2} strokeWidth="1.2" strokeLinejoin="round" />
      </g>

      {/* icon */}
      <g
        transform="translate(27 26) scale(1.75)"
        fill="none"
        stroke={color}
        strokeOpacity={on ? 1 : 0.55}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <IconPaths name={badge.icon} />
      </g>

      {/* tier pips */}
      {badge.tier && (
        <g>
          {[0, 1, 2].map((i) => {
            const x = CX + (i - 1) * 13;
            const filled = on && i < badge.tier;
            return (
              <polygon
                key={i}
                points={`${x},${pipY - 4.5} ${x + 4.5},${pipY} ${x},${pipY + 4.5} ${x - 4.5},${pipY}`}
                fill={filled ? group.color : "none"}
                stroke={filled ? group.color : "#7d818c"}
                strokeOpacity={filled ? 1 : 0.45}
                strokeWidth="1.2"
              />
            );
          })}
        </g>
      )}

      {/* padlock sticker */}
      {!on && (
        <g>
          <circle cx="77" cy="77" r="12" fill="#000" stroke="#7d818c" strokeOpacity="0.6" strokeWidth="1.2" />
          <g transform="translate(70 70) scale(0.58)" fill="none" stroke="#a4a8b3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <IconPaths name="lock" />
          </g>
        </g>
      )}
    </svg>
  );
}
