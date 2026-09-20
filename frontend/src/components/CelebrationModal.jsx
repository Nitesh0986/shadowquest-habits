import { useEffect } from "react";
import { playLevelUpFireworkSound } from "../utils/audio.js";

export function InsufficientGoldModal({ item, currentGold, onClose }) {
  if (!item) return null;
  const shortfall = (item.price ?? 0) - (currentGold ?? 0);

  return (
    <div className="sq-modal-overlay">
      <div className="sq-modal-card insufficient-gold-card">
        <div className="sq-modal-header">
          <span className="sq-modal-icon">🪙</span>
          <h2 className="font-display">INSUFFICIENT GOLD</h2>
        </div>

        <div className="sq-modal-body">
          <p className="sq-modal-quote">
            "You need more gold! Work hard and achieve it."
          </p>

          <div className="sq-gold-breakdown">
            <div className="row">
              <span>Product ({item.name}):</span>
              <strong>{item.price}g</strong>
            </div>
            <div className="row">
              <span>Your current balance:</span>
              <span>{currentGold}g</span>
            </div>
            <div className="row highlight">
              <span>Gold shortfall:</span>
              <strong style={{ color: "var(--danger)" }}>-{shortfall > 0 ? shortfall : 0}g needed</strong>
            </div>
          </div>

          <p className="sq-modal-hint">
            ⚔️ Complete quests from your Quest Log to earn XP and Gold!
          </p>
        </div>

        <div className="sq-modal-actions">
          <button type="button" className="btn-primary btn-block" onClick={onClose}>
            GOT IT, BACK TO QUESTS
          </button>
        </div>
      </div>
    </div>
  );
}

export function LevelUpModal({ level, onClose }) {
  useEffect(() => {
    playLevelUpFireworkSound();
  }, []);

  return (
    <div className="sq-modal-overlay celebration-overlay">
      <div className="sq-fireworks-bg">
        <span className="firework fw1">🎆</span>
        <span className="firework fw2">✨</span>
        <span className="firework fw3">🎇</span>
        <span className="firework fw4">🎉</span>
        <span className="firework fw5">✦</span>
      </div>

      <div className="sq-modal-card levelup-card">
        <div className="sq-levelup-header">
          <div className="sq-celebration-badge">🎉 LEVEL UP 🎉</div>
          <h1 className="font-display sq-levelup-title">CONGRATS! YOU LEVELED UP!</h1>
        </div>

        <div className="sq-levelup-body">
          <div className="sq-level-ring">
            <span className="lvl-lbl font-display">LEVEL</span>
            <span className="lvl-num font-display">{level}</span>
          </div>

          <p className="sq-levelup-desc">
            Your hard work and dedication paid off! Your character sheet power and attributes have increased.
          </p>
        </div>

        <div className="sq-modal-actions">
          <button type="button" className="btn-primary btn-block sq-levelup-btn" onClick={onClose}>
            CONTINUE CAMPAIGN
          </button>
        </div>
      </div>
    </div>
  );
}
