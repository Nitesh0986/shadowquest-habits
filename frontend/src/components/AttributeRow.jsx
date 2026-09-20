import useAnimateIn from "../hooks/useAnimateIn.js";

const MAX_ATTRIBUTE = 30;

export default function AttributeRow({ name, value }) {
  const ready = useAnimateIn();
  const percent = Math.min(100, (value / MAX_ATTRIBUTE) * 100);

  return (
    <div className="attr-row">
      <div className="attr-name">{name}</div>
      <div className="attr-track">
        <div className="attr-fill" style={{ width: ready ? `${percent}%` : "0%" }} />
      </div>
      <div className="attr-val">{value}</div>
    </div>
  );
}
