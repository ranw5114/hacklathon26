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
        <div className="anim-pop absolute top-full right-0 z-30 mt-2 flex w-80 flex-col gap-3 rounded-2xl border-[3px] border-line bg-white p-4 shadow-[0_4px_0_var(--chick-line)]">
          <div className="flex items-start gap-3">
            <Chick variant="sunny" size={36} className="shrink-0" />
            <p className="text-sm">
              <strong className="font-display">Chicks ({chicks})</strong> are your flock. You hatch one for every
              focus session and every perfect quiz. They&apos;re never spent.
            </p>
          </div>
          <div className="flex items-start gap-3">
            <Icon name="corn" size={36} className="shrink-0" />
            <div className="text-sm">
              <p>
                <strong className="font-display">Corn ({corn})</strong> is what you spend in the Henhouse on hats,
                colors, and outfits for your chicks. Earn it by:
              </p>
              <ul className="mt-2 flex flex-col gap-1.5">
                {CORN_WAYS.map((way) => (
                  <li key={way.text} className="flex items-start gap-2">
                    <Icon name={way.icon} size={18} className="mt-0.5" />
                    <span className="flex-1">{way.text}</span>
                    <span className="font-semibold whitespace-nowrap">{way.amount}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="rounded-xl bg-chick/50 px-3 py-2 text-xs">
            Chicks and corn are separate: you can&apos;t trade one for the other.
          </p>
          <Link href="/henhouse" onClick={() => setOpen(false)} className="btn-primary py-2 text-center text-sm">
            Open the Henhouse →
          </Link>
        </div>
      )}
    </div>
  );
}
