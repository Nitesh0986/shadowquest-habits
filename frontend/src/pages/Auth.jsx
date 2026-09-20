import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGame } from "../context/GameContext.jsx";
import { apiMessage } from "../api/client.js";
import PlusMark from "../components/PlusMark.jsx";
import authArt from "../assets/auth-art.jpg";

const emptyForm = { name: "", email: "", password: "", confirm: "" };

export default function Auth({ mode }) {
  const isSignup = mode === "signup";
  const navigate = useNavigate();
  const { signup, login, isAuthed, ready } = useGame();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && isAuthed) {
      navigate("/dashboard", { replace: true });
    }
  }, [ready, isAuthed, navigate]);


  function setField(field) {
    return (e) => {
      setForm((f) => ({ ...f, [field]: e.target.value }));
      setError("");
    };
  }

  async function submit(e) {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();

    if (isSignup) {
      if (!name || !email || !form.password || !form.confirm) {
        return setError("Fill in every field to create your account.");
      }
      if (form.password.length < 8) {
        return setError("Password must be at least 8 characters.");
      }
      if (form.password !== form.confirm) {
        return setError("Passwords don't match.");
      }
    } else if (!email || !form.password) {
      return setError("Enter your email and password to continue.");
    }

    setBusy(true);
    try {
      if (isSignup) {
        await signup({ name, email, password: form.password });
      } else {
        await login({ email, password: form.password });
      }
      navigate("/dashboard");
    } catch (err) {
      setError(apiMessage(err, "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div
        className="auth-art"
        style={{
          backgroundImage: `linear-gradient(0deg, rgba(0,0,0,0.6), rgba(0,0,0,0.1) 35%, rgba(0,0,0,0.35) 70%, rgba(0,0,0,0.7)), url(${authArt})`,
        }}
      >
        <Link to="/" className="wordmark font-display">
          SHADOWQUEST
        </Link>
        <PlusMark style={{ top: "18%", left: "85%" }} />
        <PlusMark style={{ top: "82%", left: "8%" }} />

        <svg className="sigil" viewBox="0 0 64 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <ellipse cx="32" cy="24" rx="19" ry="18" fill="none" stroke="#3FD9EB" strokeWidth="1.4" />
          <path d="M18,30 C18,42 24,50 32,50 C40,50 46,42 46,30" fill="none" stroke="#3FD9EB" strokeWidth="1.4" />
          <ellipse cx="24" cy="23" rx="4.2" ry="5.2" fill="#050505" stroke="#3FD9EB" strokeWidth="1.2" />
          <ellipse cx="40" cy="23" rx="4.2" ry="5.2" fill="#050505" stroke="#3FD9EB" strokeWidth="1.2" />
          <path d="M32,29 L29,36 L35,36 Z" fill="none" stroke="#3FD9EB" strokeWidth="1.1" />
          <path d="M25,42 L27,46 M31,43 L31,47 M37,42 L35,46" stroke="#3FD9EB" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="9" y1="45" x2="21" y2="37" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
          <line x1="55" y1="45" x2="43" y2="37" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" />
          <circle cx="32" cy="6" r="2" fill="none" stroke="#3FD9EB" strokeWidth="1" />
        </svg>
        <div className="sigil-line" />

        <div className="tagline">
          Every task is a quest. Every streak is a story. <b>Log in and keep the campaign alive.</b>
        </div>
      </div>

      <div className="auth-form-wrap">
        <Link to="/" className="mobile-wordmark font-display">
          SHADOWQUEST
        </Link>

        <form className="auth-form" onSubmit={submit} noValidate>
          <h1 className="font-display">{isSignup ? "Start your campaign" : "Enter the campaign"}</h1>
          <p className="sub">
            {isSignup
              ? "Create a character and start turning tasks into progress."
              : "Sign in to sync your quests and streak."}
          </p>

          {error && <div className="error-msg show" role="alert">{error}</div>}

          {isSignup && (
            <div className="field">
              <label htmlFor="name">Display name</label>
              <input id="name" type="text" placeholder="Aris Hollow" autoComplete="nickname" value={form.name} onChange={setField("name")} />
            </div>
          )}

          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" placeholder="you@example.com" autoComplete="email" value={form.email} onChange={setField("email")} />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder={isSignup ? "At least 8 characters" : "••••••••"}
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={form.password}
              onChange={setField("password")}
            />
          </div>

          {isSignup ? (
            <div className="field">
              <label htmlFor="confirm">Confirm password</label>
              <input id="confirm" type="password" placeholder="••••••••" autoComplete="new-password" value={form.confirm} onChange={setField("confirm")} />
            </div>
          ) : (
            <div className="forgot">
              <span>Forgot password?</span>
            </div>
          )}

          <button type="submit" className="btn-primary btn-block" disabled={busy}>
            {busy ? "One moment…" : isSignup ? "Create account" : "Sign in"}
          </button>

          <div className="auth-switch">
            {isSignup ? (
              <>
                Already have an account? <Link to="/login">Sign in</Link>
              </>
            ) : (
              <>
                New here? <Link to="/signup">Create an account</Link>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
