import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import { themeSwatches } from "../data/constants.js";

const TOGGLES = [
  { key: "reminders", label: "Daily quest reminders" },
  { key: "streakAlerts", label: "Streak-at-risk alerts" },
  { key: "sounds", label: "Level-up sound effects" },
];

export default function Settings() {
  const { player, settings, toggleSetting, updatePlayer, deleteAccount } = useGame();
  const navigate = useNavigate();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirmDeleteAccount() {
    setDeleting(true);
    try {
      await deleteAccount();
      navigate("/");
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div>
      <div className="page-head">
        <h1 className="page-title font-display">Settings</h1>
      </div>

      <section className="settings-section">
        <h2 className="section-label">Theme</h2>
        <div className="card theme-card">
          <div>
            <div className="theme-name font-display">Shadow Monarch (default)</div>
            <div className="swatches">
              {themeSwatches.map((color) => (
                <span key={color} className="swatch" style={{ background: color }} />
              ))}
            </div>
          </div>
          <button type="button" className="btn-outline" disabled>
            Active
          </button>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="section-label">Notifications</h2>
        <div className="card">
          {TOGGLES.map(({ key, label }) => (
            <div key={key} className="toggle-row">
              <span>{label}</span>
              <button
                type="button"
                role="switch"
                aria-checked={settings[key]}
                aria-label={label}
                className={"switch" + (settings[key] ? " on" : "")}
                onClick={() => toggleSetting(key)}
              >
                <span className="knob" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="section-label">Account</h2>
        <div className="card">
          <div className="field">
            <label htmlFor="s-name">Display name</label>
            <input id="s-name" type="text" value={player.name} onChange={(e) => updatePlayer({ name: e.target.value })} />
          </div>
          <div className="field">
            <label htmlFor="s-email">Email</label>
            <input id="s-email" type="email" value={player.email} onChange={(e) => updatePlayer({ email: e.target.value })} />
          </div>

          {confirmDelete ? (
            <div className="delete-confirm">
              <span>This removes your character and can't be undone.</span>
              <button type="button" className="btn-outline danger" disabled={deleting} onClick={confirmDeleteAccount}>
                {deleting ? "Deleting…" : "Yes, delete account"}
              </button>
              <button type="button" className="btn-outline" disabled={deleting} onClick={() => setConfirmDelete(false)}>
                Keep account
              </button>
            </div>
          ) : (
            <button type="button" className="btn-outline danger" onClick={() => setConfirmDelete(true)}>
              Delete account
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
