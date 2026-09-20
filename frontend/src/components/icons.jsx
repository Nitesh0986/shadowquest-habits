// One small line-icon set for badges, quest category chips and the category picker.
// Every icon is drawn on a 24 x 24 grid with strokes only, so they all take their
// colour from `currentColor` and scale cleanly.

const PATHS = {
  // ---- Food ----
  apple: [
    "M12 8C10.2 6.4 5 6.6 5 12.4c0 4.4 3 9 5.6 9 .8 0 1.1-.5 1.4-.5s.6.5 1.4.5c2.6 0 5.6-4.6 5.6-9C19 6.6 13.8 6.4 12 8Z",
    "M12 8c0-2 .8-3.6 2.4-4.6",
    "M12 5.2c.9-1.6 2.6-2.2 4.4-1.9-.3 1.8-1.6 2.8-4.4 1.9Z",
  ],
  utensils: [
    "M5 3v6c0 1.7 1.3 3 3 3s3-1.3 3-3V3",
    "M8 3v18",
    "M18 21V3c-2.6 1.2-4 4.2-4 8 0 1.6.8 2.4 4 2.4",
  ],
  chef: [
    "M7 14.5c-2.6-.6-3.7-3.7-1.7-5.6C5.6 6.1 8.8 4.8 10.8 6.6c1.4-2 4.9-1.4 5.7 1.3 2.8.7 3.8 4.4.5 6.6",
    "M7 14.5V20h10v-5.5",
    "M7 17.4h10",
  ],

  // ---- Fitness ----
  dumbbell: [
    "M6.5 6.5v11",
    "M17.5 6.5v11",
    "M3.5 9.5v5",
    "M20.5 9.5v5",
    "M6.5 12h11",
  ],
  pulse: [
    "M12 20.5S3.5 15.6 3.5 9.6A4.6 4.6 0 0 1 12 7.4a4.6 4.6 0 0 1 8.5 2.2c0 6-8.5 10.9-8.5 10.9Z",
    "M6.2 12.4h3l1.6-3.2 2.8 6 1.6-2.8h2.6",
  ],
  bolt: ["M13.2 2.5 5.2 13.4h6l-1 8.1 8.6-11.6h-6.2l.6-7.4Z"],

  // ---- Study ----
  book: [
    "M12 6.6C10 5.1 7 4.6 3.5 5.1v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5.1c-3.5-.5-6.5 0-8.5 1.5Z",
    "M12 6.6v13",
  ],
  bulb: [
    "M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.2 1.1 2.2h5c0-1 .5-1.7 1.1-2.2A6 6 0 0 0 12 3Z",
    "M9.7 18.4h4.6",
    "M10.6 21h2.8",
  ],
  cap: [
    "M2.5 9.6 12 5l9.5 4.6L12 14.2Z",
    "M6.6 11.7v4.4c0 1.4 2.5 2.9 5.4 2.9s5.4-1.5 5.4-2.9v-4.4",
    "M21.5 9.6v6",
  ],

  // ---- Sleep ----
  moon: [
    "M20 14.6A8.4 8.4 0 1 1 9.4 4a6.7 6.7 0 0 0 10.6 10.6Z",
    "M17 3.5v3.4M15.3 5.2h3.4",
  ],
  zzz: [
    "M3.5 7h7l-7 8h7",
    "M12.5 12h5l-5 6h5",
    "M16.5 3.5h4l-4 4.5h4",
  ],
  sunrise: [
    "M12 3.5v3.2",
    "M4.9 8.2l2.2 2.2",
    "M19.1 8.2l-2.2 2.2",
    "M2.5 17.5h19",
    "M6.5 17.5a5.5 5.5 0 0 1 11 0",
    "M8 21h8",
  ],

  // ---- Milestones ----
  sword: [
    "M12 2.5 15 5.6V15H9V5.6Z",
    "M12 6.5v6.5",
    "M6 15.5h12",
    "M12 15.5v4",
    "M9.6 21.5h4.8",
  ],
  spark: ["M12 2.5 14.4 9.6 21.5 12l-7.1 2.4L12 21.5l-2.4-7.1L2.5 12l7.1-2.4Z"],
  flame: [
    "M12 21.2c3.9 0 6.5-2.5 6.5-6.1 0-3.4-2.1-5.3-3.5-7.6-.6 1.4-1.4 2.2-2.4 2.6.3-3-.7-5.6-3.1-7.6C9.8 6.4 5.5 9.2 5.5 14.7c0 3.7 2.6 6.5 6.5 6.5Z",
    "M12 21.2c-1.7 0-2.9-1.2-2.9-2.8 0-1.6 1.5-2.5 2.9-4.5 1.4 2 2.9 2.9 2.9 4.5 0 1.6-1.2 2.8-2.9 2.8Z",
  ],
  chevrons: ["M5 11.5l7-7 7 7", "M5 19l7-7 7 7"],
  calendar: [
    "M4 5.5h16v15H4Z",
    "M4 10h16",
    "M8 3v4",
    "M16 3v4",
    "M9 15.2l2.1 2.1 4-4.2",
  ],
  crown: ["M3.5 8.2 8 12l4-7 4 7 4.5-3.8-1.6 11H5.1Z", "M5.5 19.2h13"],
  frame: [
    "M3.5 3.5h17v17h-17Z",
    "M12 12.2a2.6 2.6 0 1 0 0-5.2 2.6 2.6 0 0 0 0 5.2Z",
    "M7 17.5c.7-2.4 2.6-3.7 5-3.7s4.3 1.3 5 3.7",
  ],

  // ---- UI ----
  lock: ["M6 11h12v9.5H6Z", "M8.5 11V8a3.5 3.5 0 0 1 7 0v3"],
  check: ["M5 12.5l4.6 4.6L19 7.4"],
  star: ["M12 3l2.7 5.8 6.3.8-4.6 4.4 1.2 6.3L12 17.2 6.4 20.3l1.2-6.3L3 9.6l6.3-.8Z"],
};

export default function Icon({ name, size = 24, strokeWidth = 1.7, className, style }) {
  const paths = PATHS[name] ?? PATHS.star;
  return (
    <svg
      className={className}
      style={style}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

// Same drawing but as bare <path> nodes, so it can sit inside another <svg>
// (the badge medals use this to place an icon in their centre).
export function IconPaths({ name }) {
  const paths = PATHS[name] ?? PATHS.star;
  return paths.map((d, i) => <path key={i} d={d} />);
}
