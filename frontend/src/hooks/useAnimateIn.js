import { useEffect, useState } from "react";

// Returns false on first paint, then true after a short delay.
// Used so bars can animate from 0 to their real width when a page opens.
export default function useAnimateIn(delay = 150) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return ready;
}
