import { useGame } from "../context/GameContext.jsx";
import BadgeMedal from "./BadgeMedal.jsx";
import { groupOf } from "../lib/game-engine/badges.js";

export default function ToastLayer() {
  const { toasts } = useGame();

  return (
    <div className="toast-layer" role="status" aria-live="polite">
      {toasts.map((t) =>
        t.kind === "badge" ? (
          <div key={t.id} className="toast badge" style={{ "--c": groupOf(t.badge).color }}>
            <BadgeMedal badge={{ ...t.badge, unlocked: true }} size={44} />
            <div>
              <div className="toast-sub">Badge unlocked</div>
              <div className="toast-title">{t.badge.name}</div>
            </div>
          </div>
        ) : (
          <div key={t.id} className={"toast" + (t.kind === "error" ? " error" : "")}>
            {t.text}
          </div>
        )
      )}
    </div>
  );
}
