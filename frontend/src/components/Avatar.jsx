// Avatar with an optional frame drawn around it.
//
// Every frame is drawn on a 100 x 100 grid. The avatar itself always sits in the
// middle 60% (20..80), so each frame only has to fill the 20-unit band around it.
// Frames use `currentColor`, which the wrapper sets, so one drawing = one colour.


// Flame tongues along the top edge (y = 12, x = 12..88). The other three sides
// are this same path rotated around the centre.
const FLAME_EDGE = Array.from({ length: 5 }, (_, i) => {
  const x0 = 12 + i * 15.2;
  const x1 = x0 + 15.2;
  const tip = x0 + 11.5;
  const h = i % 2 === 0 ? 1.5 : 4; // alternate tall and short
  return `M${x0} 12.5Q${x0 - 1.5} 6.5 ${tip} ${h}Q${tip - 1.5} 8.5 ${x1} 12.5Z`;
}).join("");

const FRAME_ART = {
  // A plain steel plate: double rule, riveted edges, heavy corner brackets.
  iron: {
    color: "#b8bcc8",
    art: (
      <>
        <rect x="9" y="9" width="82" height="82" strokeWidth="2" />
        <rect x="14.5" y="14.5" width="71" height="71" strokeWidth="1" opacity="0.45" />
        <path d="M4 24V4h20M96 24V4H76M4 76v20h20M96 76v20H76" strokeWidth="4" strokeLinecap="square" />
        <g fill="currentColor" stroke="none">
          <rect x="47" y="5.5" width="6" height="6" />
          <rect x="47" y="88.5" width="6" height="6" />
          <rect x="5.5" y="47" width="6" height="6" />
          <rect x="88.5" y="47" width="6" height="6" />
        </g>
      </>
    ),
  },

  // A carved stone border: a band of runes on every side, diamond keystones in the corners.
  rune: {
    color: "#3fd9eb",
    art: (
      <>
        <rect x="6" y="6" width="88" height="88" strokeWidth="1.6" />
        <rect x="16" y="16" width="68" height="68" strokeWidth="1" opacity="0.5" />
        {[0, 90, 180, 270].map((deg) => (
          <g key={deg} transform={`rotate(${deg} 50 50)`} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M30 8v6M30 9.4 33 11 30 12.6" />
            <path d="M50 8v6M50 11l-2.6-2.6M50 11l2.6-2.6" />
            <path d="M70 8.2 72.8 11 70 13.8 67.2 11Z" />
          </g>
        ))}
        <g fill="currentColor" stroke="none">
          <path d="M6 0 12 6 6 12 0 6Z" />
          <path d="M94 0 100 6 94 12 88 6Z" />
          <path d="M6 88 12 94 6 100 0 94Z" />
          <path d="M94 88 100 94 94 100 88 94Z" />
        </g>
      </>
    ),
  },

  // Fire: a ring of flames, every tongue leaning the same way so the border seems to swirl.
  ember: {
    color: "#ff7a3d",
    art: (
      <>
        <rect x="12" y="12" width="76" height="76" strokeWidth="2" />
        <rect x="17" y="17" width="66" height="66" strokeWidth="0.8" opacity="0.5" />
        {[0, 90, 180, 270].map((deg) => (
          <path key={deg} transform={`rotate(${deg} 50 50)`} fill="currentColor" stroke="none" d={FLAME_EDGE} />
        ))}
      </>
    ),
  },

  // Ice: a dashed inner rule, lattice frost in the corners, a snowflake on each edge.
  frost: {
    color: "#8fd3ff",
    art: (
      <>
        <rect x="9" y="9" width="82" height="82" strokeWidth="1.5" />
        <rect x="15" y="15" width="70" height="70" strokeWidth="0.8" opacity="0.5" strokeDasharray="2 3" />
        {[
          "",
          "translate(100 0) scale(-1 1)",
          "translate(0 100) scale(1 -1)",
          "translate(100 100) scale(-1 -1)",
        ].map((t, i) => (
          <g key={i} transform={t}>
            <path d="M9 30 30 9M9 22 22 9M9 14 14 9" strokeWidth="1" opacity="0.65" />
            <path d="M9 2.5 15.5 9 9 15.5 2.5 9Z" fill="currentColor" stroke="none" />
          </g>
        ))}
        {[
          [50, 9],
          [50, 91],
          [9, 50],
          [91, 50],
        ].map(([x, y]) => (
          <g key={`${x}-${y}`} transform={`translate(${x} ${y})`} strokeWidth="1.2" strokeLinecap="round">
            <circle r="5.2" fill="#050505" stroke="none" />
            <path d="M-4.5 0h9M-2.25 -3.9l4.5 7.8M-2.25 3.9l4.5 -7.8" />
          </g>
        ))}
      </>
    ),
  },

  // Royal: chamfered corners, a crown on top, points on the sides.
  monarch: {
    color: "#a98bff",
    art: (
      <>
        <path d="M10 22 22 10H78L90 22V78L78 90H22L10 78Z" strokeWidth="2" />
        <path d="M16 22 22 16H78L84 22V78L78 84H22L16 78Z" strokeWidth="0.8" opacity="0.5" />
        <g fill="currentColor" stroke="none">
          <path d="M31 10 27.5 3.5 39 7.5 50 1 61 7.5 72.5 3.5 69 10Z" />
          <circle cx="27.5" cy="2.8" r="1.7" />
          <circle cx="50" cy="0.7" r="1.7" />
          <circle cx="72.5" cy="2.8" r="1.7" />
          <path d="M10 41 2 50 10 59Z" />
          <path d="M90 41 98 50 90 59Z" />
          <path d="M42 90 50 98 58 90Z" />
        </g>
      </>
    ),
  },

  // Gold: three rules, star on top, sunburst lines in the corners.
  sigil: {
    color: "#f0c24b",
    art: (
      <>
        <rect x="7" y="7" width="86" height="86" strokeWidth="2.2" />
        <rect x="12" y="12" width="76" height="76" strokeWidth="1" />
        <rect x="16" y="16" width="68" height="68" strokeWidth="0.7" opacity="0.5" />
        {[
          "",
          "translate(100 0) scale(-1 1)",
          "translate(0 100) scale(1 -1)",
          "translate(100 100) scale(-1 -1)",
        ].map((t, i) => (
          <g key={i} transform={t}>
            <path d="M7 7 16 16" strokeWidth="1" opacity="0.7" />
            <path d="M7 0.5 13.5 7 7 13.5 0.5 7Z" fill="#050505" strokeWidth="1.4" />
            <path d="M7 3.5 10.5 7 7 10.5 3.5 7Z" fill="currentColor" stroke="none" />
          </g>
        ))}
        <path d="M50 -.5 53 4 58 7 53 10 50 15 47 10 42 7 47 4Z" fill="currentColor" stroke="none" transform="translate(0 0.5)" />
        <g fill="currentColor" stroke="none">
          <circle cx="7" cy="50" r="2.6" />
          <circle cx="93" cy="50" r="2.6" />
          <circle cx="50" cy="93" r="2.6" />
        </g>
      </>
    ),
  },
};

export const FRAME_IDS = Object.keys(FRAME_ART);

export default function Avatar({ name, frame, size = 108 }) {
  const def = frame ? FRAME_ART[frame] : null;
  const core = size * 0.6;

  return (
    <div className="avatar-wrap" style={{ width: size, height: size, color: def?.color }}>
      <div className="avatar-core font-display" style={{ width: core, height: core, fontSize: core * 0.42 }} aria-hidden="true">
        {name.charAt(0).toUpperCase()}
      </div>
      {def && (
        <svg
          className={"avatar-frame" + (frame === "sigil" || frame === "monarch" ? " glow" : "")}
          viewBox="0 0 100 100"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          {def.art}
        </svg>
      )}
    </div>
  );
}
