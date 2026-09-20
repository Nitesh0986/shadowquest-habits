import { Routes, Route, Navigate } from "react-router-dom";
import { useGame } from "./context/GameContext.jsx";
import AppShell from "./components/AppShell.jsx";
import Landing from "./pages/Landing.jsx";
import Auth from "./pages/Auth.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import QuestLog from "./pages/QuestLog.jsx";
import Shop from "./pages/Shop.jsx";
import Profile from "./pages/Profile.jsx";
import Settings from "./pages/Settings.jsx";

// Blocks the signed-in pages until we know whether a stored token is still
// good (ready) and, if so, redirects a signed-out visitor to /login.
function RequireAuth({ children }) {
  const { ready, isAuthed } = useGame();
  if (!ready) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Auth key="login" mode="login" />} />
      <Route path="/signup" element={<Auth key="signup" mode="signup" />} />

      {/* Signed-in pages that share the sidebar */}
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/quests" element={<QuestLog />} />
        <Route path="/shop" element={<Shop />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
