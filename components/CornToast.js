"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";

// Call this right after adding corn, e.g. announceCorn(10, "Concept understood"),
// and a "+10 corn" pop-up appears at the top of the screen, so students see where corn comes from.
export function announceCorn(amount, reason) {
  if (amount > 0) window.dispatchEvent(new CustomEvent("chick-corn", { detail: { amount, reason } }));
}

const SHOW_MS = 3200;

// The pop-up itself. Mounted once in the app layout.
export default function CornToast() {
  const [toasts, setToasts] = useState([]); // [{ id, amount, reason }]

  useEffect(() => {
    function onCorn(event) {
      const toast = { id: `${Date.now()}-${Math.random()}`, ...event.detail };
      setToasts((list) => [...list, toast]);
      setTimeout(() => setToasts((list) => list.filter((t) => t.id !== toast.id)), SHOW_MS);
    }
    window.addEventListener("chick-corn", onCorn);
    return () => window.removeEventListener("chick-corn", onCorn);
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-50 flex flex-col items-center gap-2 px-4 sm:top-16" aria-live="polite">
      {toasts.map((t) => (
        <p
          key={t.id}
          className="anim-pop flex items-center gap-2 rounded-full border-[3px] border-line bg-chick px-4 py-1.5 font-display font-semibold shadow-[0_3px_0_var(--chick-line)]"
        >
          <Icon name="corn" size={22} /> +{t.amount} corn
          {t.reason && <span className="text-sm font-normal text-muted">· {t.reason}</span>}
        </p>
      ))}
    </div>
  );
}
