// The small "+" registration mark used on the landing grid and auth art.
export default function PlusMark({ className = "", style }) {
  return (
    <div className={`plus ${className}`} style={style} aria-hidden="true">
      <div className="bh" />
      <div className="bv" />
    </div>
  );
}
