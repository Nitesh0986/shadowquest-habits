import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import ToastLayer from "./ToastLayer.jsx";

const items = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/quests", label: "Quest log" },
  { to: "/shop", label: "Shop" },
  { to: "/profile", label: "Profile" },
  { to: "/settings", label: "Settings" },
];

const linkClass = (base) => ({ isActive }) => base + (isActive ? " active" : "");

export default function AppShell() {
  const { logout } = useGame();
  const navigate = useNavigate();

  function signOut() {
    logout();
    navigate("/");
  }

  return (
    <>
      <div className="bg-glow" />
      <ToastLayer />

      <div className="shell">
        <aside className="sidebar">
          <Link to="/" className="wordmark font-display">
            SHADOWQUEST
          </Link>

          <nav aria-label="Main">
            {items.map((item, i) => (
              <NavLink key={item.to} to={item.to} className={linkClass("navitem")}>
                <span className="n">{String(i + 1).padStart(2, "0")}.</span>
                {item.label}
              </NavLink>
            ))}
          </nav>

          <button
            type="button"
            className="signout"
            onClick={signOut}
            style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", font: "inherit" }}
          >
            Sign out
          </button>
        </aside>

        <main className="main">
          <Outlet />
        </main>
      </div>

      <nav className="bottom-nav" aria-label="Main">
        {items.map((item) => (
          <NavLink key={item.to} to={item.to} className={linkClass("bottom-link")}>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
