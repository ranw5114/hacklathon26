import { useEffect, useState } from "react";

// The current time, updated every second. Used to redraw countdowns.
export function useNow() {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  return now;
}
