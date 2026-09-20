import axios from "axios";

// The merge layer: every GameContext action goes through this instead of
// touching local state directly. See backend/README.md's API table.
export const TOKEN_KEY = "shadowquest_token";
export const AUTH_EXPIRED_EVENT = "shadowquest:auth-expired";

function getBaseUrl() {
  let url = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").trim();
  url = url.replace(/\/+$/, "");
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }
  return url;
}

const api = axios.create({
  baseURL: getBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If a token expires or is rejected mid-session, drop it and let
// GameContext know so it can sign the player out cleanly.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }
    return Promise.reject(err);
  }
);

// Every backend error body looks like { message, code, ... } (see backend/README.md).
export function apiMessage(err, fallback) {
  if (err?.code === "ERR_NETWORK" || err?.message === "Network Error" || (!err?.response && err?.request)) {
    return "Cannot connect to server. Please ensure the backend is running and reachable.";
  }
  return err?.response?.data?.message || fallback;
}

export default api;
