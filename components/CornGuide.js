"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Chick from "@/components/Chick";
import Icon from "@/components/Icon";
import { chickCount, CORN_WAYS, withDefaults } from "@/lib/flock";

// The chicks and corn counter in the top bar. Tapping it explains what each one is and how to earn corn.
export default function CornGuide({ flock }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const chicks = chickCount(flock);
  const corn = withDefaults(flock).corn;

  // Close when clicking anywhere else, or pressing Escape.
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !boxRef.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={boxRef} className="relative ml-auto">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex items-center gap-1 rounded-full border-2 border-line bg-white py-0.5 pr-3 pl-2 font-display font-semibold transition hover:bg-chick/40"
        title="What are chicks and corn?"
      >
        <Chick variant="sunny" size={26} /> {chicks}
        <span className="ml-1.5 flex items-center gap-1">
          <Icon name="corn" size={20} /> {corn}
        </span>
      </button>

      {open && (
        <div className="anim-pop absolute top-full right-0 z-30 mt-2 flex w-80 max-w-[calc(100vw-1.5rem)] flex-col gap-3 rounded-2xl border-[3px] border-line bg-white p-4 shadow-[0_4px_0_var(--chick-line)]">
          {/* What you have: chicks to keep, corn to spend */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col items-center rounded-2xl bg-chick/40 px-2 py-2.5 text-center">
              <Chick variant="sunny" size={34} />
              <p className="mt-1 font-display text-lg leading-none font-semibold">
                {chicks} chick{chicks === 1 ? "" : "s"}
              </p>
              <p className="mt-1 text-xs text-muted">Your flock. Never spent.</p>
            </div>
            <div className="flex flex-col items-center rounded-2xl bg-chick/40 px-2 py-2.5 text-center">
              <Icon name="corn" size={34} />
              <p className="mt-1 font-display text-lg leading-none font-semibold">{corn} corn</p>
              <p className="mt-1 text-xs text-muted">Spend it on outfits.</p>
            </div>
          </div>

          {/* How to earn more corn */}
          <div>
            <p className="label-small">Earn corn</p>
            <ul className="mt-1.5 flex flex-col gap-1.5">
              {CORN_WAYS.map((way) => (
                <li key={way.text} className="flex items-center gap-2.5 rounded-xl border-2 border-line/15 px-2.5 py-1.5">
                  <Icon name={way.icon} size={22} className="shrink-0" />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-sm font-semibold">{way.text}</span>
                    <span className="block text-xs text-muted">{way.detail}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-chick px-2 py-0.5 font-display text-sm font-semibold whitespace-nowrap">{way.amount}</span>
                </li>
              ))}
            </ul>
          </div>

          <Link href="/henhouse/shop" onClick={() => setOpen(false)} className="btn-primary py-2 text-center text-sm">
            Open the Shop →
          </Link>
        </div>
      )}
    </div>
  );
}
